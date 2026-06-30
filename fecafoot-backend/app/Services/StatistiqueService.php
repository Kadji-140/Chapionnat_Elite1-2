<?php

namespace App\Services;

use App\Models\StatJoueur;
use App\Models\Rencontre;
use App\Models\MatchEvent;
use App\Models\CompositionJoueur;
use App\Models\Competition;
use Illuminate\Support\Facades\DB;

class StatistiqueService
{
    /**
     * Recalcule toutes les statistiques des joueurs d'une compétition spécifique.
     */
    public function recalculerCompetition(int $competitionId): void
    {
        $competition = Competition::with('phases.poules')->findOrFail($competitionId);
        
        // 1. Récupérer tous les matchs homologués de cette compétition
        $pouleIds = $competition->phases->flatMap(fn($p) => $p->poules->pluck('id'))->toArray();
        
        $matchs = Rencontre::whereIn('poule_id', $pouleIds)
            ->where('statut', 'homologue')
            ->get();
            
        $matchIds = $matchs->pluck('id')->toArray();

        // 2. Récupérer tous les joueurs ayant participé à ces matchs (soit titulaires, soit remplaçants)
        $compositions = DB::table('compositions')
            ->whereIn('match_id', $matchIds)
            ->pluck('id')
            ->toArray();

        if (empty($compositions)) {
            // Aucun match ou aucune composition, vider les stats
            StatJoueur::where('competition_id', $competitionId)->delete();
            return;
        }

        $joueurIds = DB::table('composition_joueurs')
            ->whereIn('composition_id', $compositions)
            ->distinct()
            ->pluck('joueur_id')
            ->toArray();

        // Vider les stats actuelles pour cette compétition
        StatJoueur::where('competition_id', $competitionId)->delete();

        // 3. Recalculer pour chaque joueur
        foreach ($joueurIds as $joueurId) {
            $stats = $this->calculerStatsJoueur($joueurId, $competitionId, $matchIds);
            if ($stats['nb_matchs'] > 0 || $stats['buts'] > 0 || $stats['passes_decisives'] > 0 || $stats['cartons_jaunes'] > 0 || $stats['cartons_rouges'] > 0) {
                StatJoueur::create([
                    'joueur_id'      => $joueurId,
                    'competition_id' => $competitionId,
                    'buts'           => $stats['buts'],
                    'passes_decisives' => $stats['passes_decisives'],
                    'cartons_jaunes'  => $stats['cartons_jaunes'],
                    'cartons_rouges'  => $stats['cartons_rouges'],
                    'minutes_jouees'  => $stats['minutes_jouees'],
                    'nb_matchs'       => $stats['nb_matchs'],
                ]);
            }
        }
    }

    /**
     * Calcule les statistiques d'un joueur pour une compétition.
     */
    private function calculerStatsJoueur(int $joueurId, int $competitionId, array $matchIds): array
    {
        if (empty($matchIds)) {
            return [
                'buts' => 0, 'passes_decisives' => 0, 'cartons_jaunes' => 0,
                'cartons_rouges' => 0, 'minutes_jouees' => 0, 'nb_matchs' => 0
            ];
        }

        // 1. Nombre de matchs joués (où le joueur figure dans la composition, titulaire ou remplaçant)
        // Mais attention : on ne compte le match que s'il a joué au moins 1 minute ou s'il a commencé comme titulaire.
        // On va vérifier sa présence sur la feuille de match pour les matchs homologués.
        $participations = CompositionJoueur::whereHas('composition', function($q) use ($matchIds) {
                $q->whereIn('match_id', $matchIds);
            })
            ->where('joueur_id', $joueurId)
            ->with(['composition.match'])
            ->get();

        $nbMatchs = 0;
        $minutesJouees = 0;

        foreach ($participations as $part) {
            $match = $part->composition->match;
            $role = $part->role; // 'titulaire' ou 'remplacant'
            $clubId = $part->composition->club_id;
            
            // Chercher les événements du match liés au joueur pour calculer son temps de jeu
            $events = MatchEvent::where('match_id', $match->id)
                ->where('statut', 'valide')
                ->get();

            // S'il est titulaire
            if ($role === 'titulaire') {
                $aJoue = true;
                $minuteSortie = 90; // Par défaut, fin du match réglementaire

                // S'il a été remplacé
                $remplacement = $events->where('type', 'remplacement')->where('joueur_id', $joueurId)->first();
                if ($remplacement) {
                    $minuteSortie = $remplacement->minute;
                }

                // S'il a été exclu (rouge direct ou cumul)
                $exclusion = $events->whereIn('type', ['carton_rouge', 'carton_jaune_rouge'])
                    ->where('joueur_id', $joueurId)
                    ->first();
                if ($exclusion && $exclusion->minute < $minuteSortie) {
                    $minuteSortie = $exclusion->minute;
                }

                $minutesJouees += max(0, $minuteSortie);
                $nbMatchs++;
            } 
            // S'il est remplaçant, il n'a joué que s'il est entré en jeu
            else {
                $remplacement = $events->where('type', 'remplacement')->where('joueur_remplacant_id', $joueurId)->first();
                if ($remplacement) {
                    $minuteEntree = $remplacement->minute;
                    $minuteSortie = 90;

                    // S'il a lui-même été remplacé plus tard (rare mais possible)
                    $deuxiemeRemp = $events->where('type', 'remplacement')
                        ->where('joueur_id', $joueurId)
                        ->where('minute', '>', $minuteEntree)
                        ->first();
                    if ($deuxiemeRemp) {
                        $minuteSortie = $deuxiemeRemp->minute;
                    }

                    // S'il a été exclu
                    $exclusion = $events->whereIn('type', ['carton_rouge', 'carton_jaune_rouge'])
                        ->where('joueur_id', $joueurId)
                        ->where('minute', '>', $minuteEntree)
                        ->first();
                    if ($exclusion && $exclusion->minute < $minuteSortie) {
                        $minuteSortie = $exclusion->minute;
                    }

                    $minutesJouees += max(0, $minuteSortie - $minuteEntree);
                    $nbMatchs++;
                }
            }
        }

        // 2. Buts marqués (but et penalty_marque)
        $buts = MatchEvent::whereIn('match_id', $matchIds)
            ->where('joueur_id', $joueurId)
            ->whereIn('type', ['but', 'penalty_marque'])
            ->where('statut', 'valide')
            ->count();

        // 3. Passes décisives (sur les buts du joueur_remplacant_id du même club)
        $passes = MatchEvent::whereIn('match_id', $matchIds)
            ->where('joueur_remplacant_id', $joueurId)
            ->whereIn('type', ['but', 'penalty_marque'])
            ->where('statut', 'valide')
            ->count();

        // 4. Discipline (jaunes et rouges)
        $jaunes = MatchEvent::whereIn('match_id', $matchIds)
            ->where('joueur_id', $joueurId)
            ->where('type', 'carton_jaune')
            ->where('statut', 'valide')
            ->count();

        // Un carton rouge direct
        $rougesDirects = MatchEvent::whereIn('match_id', $matchIds)
            ->where('joueur_id', $joueurId)
            ->where('type', 'carton_rouge')
            ->where('statut', 'valide')
            ->count();

        // Une expulsion automatique pour 2 jaunes
        $jaunesRouges = MatchEvent::whereIn('match_id', $matchIds)
            ->where('joueur_id', $joueurId)
            ->where('type', 'carton_jaune_rouge')
            ->where('statut', 'valide')
            ->count();

        $cartonsRouges = $rougesDirects + $jaunesRouges;

        return [
            'buts'             => $buts,
            'passes_decisives' => $passes,
            'cartons_jaunes'  => $jaunes,
            'cartons_rouges'  => $cartonsRouges,
            'minutes_jouees'  => $minutesJouees,
            'nb_matchs'       => $nbMatchs,
        ];
    }
}

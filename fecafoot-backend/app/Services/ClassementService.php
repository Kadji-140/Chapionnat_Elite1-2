<?php

namespace App\Services;

use App\Models\ClassementClub;
use App\Models\Poule;
use App\Models\Rencontre;
use App\Models\Penalite;
use App\Models\MatchEvent;
use Illuminate\Support\Facades\DB;

class ClassementService
{
    /**
     * Recalcule le classement d'une poule spécifique.
     */
    public function recalculerPoule(int $pouleId): void
    {
        $poule = Poule::with(['clubs', 'phase.competition.saison', 'phase.competition.regles'])->findOrFail($pouleId);
        $saison = $poule->phase->competition->saison;
        $competition = $poule->phase->competition;

        // 1. Validation de saison active
        if ($saison->statut !== 'en_cours') {
            return; // Gel automatique si la saison n'est pas active
        }

        // 2. Validation de gel du classement de la poule
        if ($poule->classement_gele) {
            return; // Le classement est gelé (phase régulière terminée ou décision admin)
        }

        $clubs = $poule->clubs;
        $regles = $competition->regles;

        foreach ($clubs as $club) {
            $stats = $this->calculerStatsClub($club->id, $pouleId, $saison->id, $regles);

            // Rechercher ou créer la ligne de classement
            ClassementClub::updateOrCreate(
                [
                    'club_id'   => $club->id,
                    'poule_id'  => $pouleId,
                    'saison_id' => $saison->id,
                ],
                $stats
            );
        }

        // Mettre à jour les positions (classement)
        $this->attribuerPositions($pouleId, $saison->id, $regles);
    }

    /**
     * Calcule toutes les statistiques de classement d'un club pour une saison/poule donnée.
     */
    private function calculerStatsClub(int $clubId, int $pouleId, int $saisonId, $regles): array
    {
        // Récupérer tous les matchs homologués de la poule impliquant le club
        $matchs = Rencontre::where('poule_id', $pouleId)
            ->where('statut', 'homologue')
            ->where(function ($query) use ($clubId) {
                $query->where('club_domicile_id', $clubId)
                      ->orWhere('club_exterieur_id', $clubId);
            })
            ->get();

        $nbMatchs = 0;
        $victoires = 0;
        $nuls = 0;
        $defaites = 0;
        $butsPour = 0;
        $butsContre = 0;

        foreach ($matchs as $match) {
            $nbMatchs++;
            $estDom = ($match->club_domicile_id === $clubId);

            // Utiliser les scores officiels s'ils existent (tapis vert / correction), sinon les scores du terrain
            $scoreDom = $match->score_domicile_officiel ?? $match->score_domicile_terrain ?? 0;
            $scoreExt = $match->score_exterieur_officiel ?? $match->score_exterieur_terrain ?? 0;

            $bp = $estDom ? $scoreDom : $scoreExt;
            $bc = $estDom ? $scoreExt : $scoreDom;

            $butsPour += $bp;
            $butsContre += $bc;

            if ($bp > $bc) {
                $victoires++;
            } elseif ($bp === $bc) {
                $nuls++;
            } else {
                $defaites++;
            }
        }

        // Utiliser les points définis dans les règles si disponibles
        $ptsVictoire = $regles->points_victoire ?? 3;
        $ptsNul      = $regles->points_nul ?? 1;
        $ptsDefaite  = $regles->points_defaite ?? 0;

        // Calculer les points bruts
        $points = ($victoires * $ptsVictoire) + ($nuls * $ptsNul) + ($defaites * $ptsDefaite);

        // Calculer les cartons reçus (uniquement sur les matchs de cette poule)
        $matchIds = $matchs->pluck('id')->toArray();
        $cartonsJaunes = 0;
        $cartonsRouges = 0;

        if (count($matchIds) > 0) {
            $cartonsJaunes = MatchEvent::whereIn('match_id', $matchIds)
                ->where('club_id', $clubId)
                ->where('type', 'carton_jaune')
                ->where('statut', 'valide')
                ->count();

            $cartonsRouges = MatchEvent::whereIn('match_id', $matchIds)
                ->where('club_id', $clubId)
                ->whereIn('type', ['carton_rouge', 'carton_jaune_rouge'])
                ->where('statut', 'valide')
                ->count();
        }

        // Calculer le total des points de pénalité appliqués activement à ce club pour cette saison
        $pointsPenalite = Penalite::where('club_id', $clubId)
            ->where('saison_id', $saisonId)
            ->where('active', true)
            ->sum('points_retires');

        return [
            'nb_matchs'       => $nbMatchs,
            'victoires'       => $victoires,
            'nuls'            => $nuls,
            'defaites'        => $defaites,
            'buts_pour'       => $butsPour,
            'buts_contre'     => $butsContre,
            'diff_buts'       => $butsPour - $butsContre,
            'points'          => $points,
            'cartons_jaunes'  => $cartonsJaunes,
            'cartons_rouges'  => $cartonsRouges,
            'points_penalite' => $pointsPenalite,
        ];
    }

    /**
     * Attribue et met à jour les positions (1ère, 2ème place, etc.) des clubs.
     */
    private function attribuerPositions(int $pouleId, int $saisonId, $regles): void
    {
        $classements = ClassementClub::where('poule_id', $pouleId)
            ->where('saison_id', $saisonId)
            ->get();

        $criteres = $regles->criteres_egalite ?? ['points', 'diff_buts', 'buts_pour', 'confrontation_directe', 'fair_play', 'tirage_au_sort'];

        // Trier les clubs selon l'algorithme des critères de départage
        $classementsTries = $classements->sort(function ($a, $b) use ($criteres, $pouleId) {
            return $this->comparerClubs($a, $b, $criteres, 0, $pouleId);
        })->values();

        // 1. Temporairement mettre à 0 toutes les positions de cette poule/saison pour éviter la contrainte UNIQUE
        ClassementClub::where('poule_id', $pouleId)
            ->where('saison_id', $saisonId)
            ->update(['position' => 0]);

        // 2. Enregistrer les nouvelles positions réelles (> 0)
        foreach ($classementsTries as $index => $classement) {
            $classement->position = $index + 1;
            $classement->save();
        }
    }

    /**
     * Fonction récursive comparant deux clubs en appliquant les critères configurés séquentiellement.
     */
    private function comparerClubs(ClassementClub $a, ClassementClub $b, array $criteres, int $indexCritere, int $pouleId): int
    {
        // En cas d'égalité sur l'ensemble des critères configurés, on utilise un critère stable (ID club)
        if ($indexCritere >= count($criteres)) {
            return $a->club_id <=> $b->club_id;
        }

        $critere = $criteres[$indexCritere];

        if ($critere === 'points') {
            $ptsA = max(0, $a->points - $a->points_penalite);
            $ptsB = max(0, $b->points - $b->points_penalite);
            if ($ptsA !== $ptsB) {
                return $ptsB <=> $ptsA; // Plus de points en tête
            }
        } 
        elseif ($critere === 'diff_buts') {
            if ($a->diff_buts !== $b->diff_buts) {
                return $b->diff_buts <=> $a->diff_buts;
            }
        } 
        elseif ($critere === 'buts_pour') {
            if ($a->buts_pour !== $b->buts_pour) {
                return $b->buts_pour <=> $a->buts_pour;
            }
        } 
        elseif ($critere === 'confrontation_directe') {
            $res = $this->calculerConfrontationDirecte($a->club_id, $b->club_id, $pouleId);
            if ($res !== 0) {
                return $res;
            }
        } 
        elseif ($critere === 'fair_play') {
            // Cartons reçus (plus bas score = meilleur fair-play)
            $scoreA = ($a->cartons_jaunes * 1) + ($a->cartons_rouges * 3);
            $scoreB = ($b->cartons_jaunes * 1) + ($b->cartons_rouges * 3);
            if ($scoreA !== $scoreB) {
                return $scoreA <=> $scoreB;
            }
        }
        elseif ($critere === 'tirage_au_sort') {
            return $a->club_id <=> $b->club_id;
        }

        // Si égalité sur le critère actuel, passer au critère suivant
        return $this->comparerClubs($a, $b, $criteres, $indexCritere + 1, $pouleId);
    }

    /**
     * Calcule le départage sur les confrontations directes entre deux clubs.
     */
    private function calculerConfrontationDirecte(int $clubA, int $clubB, int $pouleId): int
    {
        $matchs = Rencontre::where('poule_id', $pouleId)
            ->where('statut', 'homologue')
            ->where(function ($query) use ($clubA, $clubB) {
                $query->where(function ($q) use ($clubA, $clubB) {
                    $q->where('club_domicile_id', $clubA)->where('club_exterieur_id', $clubB);
                })->orWhere(function ($q) use ($clubA, $clubB) {
                    $q->where('club_domicile_id', $clubB)->where('club_exterieur_id', $clubA);
                });
            })
            ->get();

        if ($matchs->isEmpty()) {
            return 0;
        }

        $ptsA = 0;
        $ptsB = 0;
        $diffA = 0;

        foreach ($matchs as $match) {
            $scoreDom = $match->score_domicile_officiel ?? $match->score_domicile_terrain ?? 0;
            $scoreExt = $match->score_exterieur_officiel ?? $match->score_exterieur_terrain ?? 0;

            if ($match->club_domicile_id === $clubA) {
                $diffA += ($scoreDom - $scoreExt);
                if ($scoreDom > $scoreExt) {
                    $ptsA += 3;
                } elseif ($scoreDom === $scoreExt) {
                    $ptsA += 1;
                    $ptsB += 1;
                } else {
                    $ptsB += 3;
                }
            } else {
                $diffA += ($scoreExt - $scoreDom);
                if ($scoreExt > $scoreDom) {
                    $ptsA += 3;
                } elseif ($scoreExt === $scoreDom) {
                    $ptsA += 1;
                    $ptsB += 1;
                } else {
                    $ptsB += 3;
                }
            }
        }

        if ($ptsA !== $ptsB) {
            return $ptsB <=> $ptsA;
        }

        if ($diffA !== 0) {
            return $diffA > 0 ? -1 : 1;
        }

        return 0;
    }
}

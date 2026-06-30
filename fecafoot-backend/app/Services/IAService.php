<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Models\Rencontre;
use App\Models\User;
use App\Models\PredictionMatch;
use Carbon\Carbon;

class IAService
{
    /**
     * Calcule les caractéristiques d'un match et appelle Flask pour obtenir la prédiction.
     */
    public function predictMatch(int $matchId)
    {
        $match = Rencontre::findOrFail($matchId);
        $matchDate = $match->date_heure ? $match->date_heure->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
        $homeId = $match->club_domicile_id;
        $awayId = $match->club_exterieur_id;
        $competitionId = $match->competition_id;

        // Calcul des features chronologiques (exactement comme dans l'export)
        $formDom = $this->getFormRecent($homeId, $matchDate);
        $formExt = $this->getFormRecent($awayId, $matchDate);
        $moyDom = $this->getMoyenneButsSaison($homeId, $competitionId, $matchDate);
        $moyExt = $this->getMoyenneButsSaison($awayId, $competitionId, $matchDate);
        $h2h = $this->getConfrontationsDirectes($homeId, $awayId, $matchDate);

        $payload = [
            'victoires_dom_5' => $formDom['victoires'],
            'nuls_dom_5' => $formDom['nuls'],
            'defaites_dom_5' => $formDom['defaites'],
            'victoires_ext_5' => $formExt['victoires'],
            'nuls_ext_5' => $formExt['nuls'],
            'defaites_ext_5' => $formExt['defaites'],
            'buts_marques_dom_moy' => round($moyDom['marques'], 2),
            'buts_encaisses_dom_moy' => round($moyDom['encaisses'], 2),
            'buts_marques_ext_moy' => round($moyExt['marques'], 2),
            'buts_encaisses_ext_moy' => round($moyExt['encaisses'], 2),
            'h2h_dom_wins' => $h2h['win_dom'],
            'h2h_nuls' => $h2h['nuls'],
            'h2h_ext_wins' => $h2h['win_ext']
        ];

        // Appel au microservice Flask
        try {
            $response = Http::timeout(5)->post('http://127.0.0.1:5000/predict/match', $payload);
            
            if ($response->successful()) {
                $data = $response->json();
                
                // Enregistrer dans la table prediction_matchs
                PredictionMatch::updateOrCreate(
                    ['match_id' => $matchId],
                    [
                        'proba_victoire_dom' => $data['victoire_domicile'] / 100,
                        'proba_nul' => $data['nul'] / 100,
                        'proba_victoire_ext' => $data['victoire_exterieur'] / 100,
                        'phase_competition' => $match->phase?->nom ?? 'Phase Régulière',
                        'terrain_neutre' => $match->terrain_neutre,
                        'modele_version' => 'RandomForest_v1.0',
                        'date_calcul' => now()
                    ]
                );

                return $data;
            }
        } catch (\Exception $e) {
            // Loguer l'erreur ou la gérer silencieusement en retournant une prédiction par défaut
            logger()->error("Erreur microservice IA (Match {$matchId}) : " . $e->getMessage());
        }

        // Retourner un résultat par défaut/neutre si Flask ne répond pas
        return [
            'victoire_domicile' => 33.3,
            'nul' => 33.4,
            'victoire_exterieur' => 33.3,
            'prediction' => 'nul',
            'confiance' => 'faible',
            'error' => 'Flask indisponible'
        ];
    }

    /**
     * Appelle le service Flask pour calculer le Talent Score d'un joueur et le stocke.
     */
    public function computePlayerTalentScore(int $joueurId, int $saisonId)
    {
        $joueur = DB::table('joueurs')->where('id', $joueurId)->first();
        if (!$joueur) return null;

        // Récupérer les stats cumulées du joueur pour cette saison
        // On cherche dans la table stat_joueurs liée à la compétition de la saison
        $stats = DB::table('stat_joueurs')
            ->join('competitions', 'stat_joueurs.competition_id', '=', 'competitions.id')
            ->where('stat_joueurs.joueur_id', $joueurId)
            ->where('competitions.saison_id', $saisonId)
            ->select('stat_joueurs.*')
            ->first();

        // Si aucune statistique, on envoie des valeurs à 0
        $payload = [
            'poste' => $joueur->poste ?? 'inconnu',
            'buts' => $stats->buts ?? 0,
            'passes_decisives' => $stats->passes_decisives ?? 0,
            'minutes_jouees' => $stats->minutes_jouees ?? 0,
            'nb_matchs' => $stats->nb_matchs ?? 0,
            'cartons_jaunes' => $stats->cartons_jaunes ?? 0,
            'cartons_rouges' => $stats->cartons_rouges ?? 0
        ];

        try {
            $response = Http::timeout(5)->post('http://127.0.0.1:5000/talent-score', $payload);

            if ($response->successful()) {
                $data = $response->json();

                // Enregistrer dans la table talent_scores
                DB::table('talent_scores')->updateOrInsert(
                    [
                        'joueur_id' => $joueurId,
                        'saison_id' => $saisonId
                    ],
                    [
                        'score_global' => $data['talent_score'],
                        'score_offensive' => $data['details']['score_offensive'],
                        'score_defensive' => $data['details']['score_defensive'],
                        'score_discipline' => $data['details']['score_discipline'],
                        'details' => json_encode($data['details']),
                        'modele_version' => 'TalentModel_v1.0',
                        'date_calcul' => now(),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]
                );

                return $data;
            }
        } catch (\Exception $e) {
            logger()->error("Erreur microservice IA (Joueur {$joueurId}) : " . $e->getMessage());
        }

        return null;
    }

    // --- Fonctions auxiliaires identiques à ExporterDonneesIA ---

    private function getFormRecent(int $teamId, string $date)
    {
        $matchs = DB::table('matchs')
            ->where(function ($query) use ($teamId) {
                $query->where('club_domicile_id', $teamId)
                      ->orWhere('club_exterieur_id', $teamId);
            })
            ->whereIn('statut', ['termine', 'homologue'])
            ->where('date_heure', '<', $date)
            ->orderBy('date_heure', 'desc')
            ->limit(5)
            ->get();

        $victoires = 0;
        $nuls = 0;
        $defaites = 0;

        foreach ($matchs as $m) {
            $scoreDom = $m->score_domicile_officiel ?? $m->score_domicile_terrain;
            $scoreExt = $m->score_exterieur_officiel ?? $m->score_exterieur_terrain;

            if ($m->club_domicile_id == $teamId) {
                if ($scoreDom > $scoreExt) $victoires++;
                elseif ($scoreDom < $scoreExt) $defaites++;
                else $nuls++;
            } else {
                if ($scoreExt > $scoreDom) $victoires++;
                elseif ($scoreExt < $scoreDom) $defaites++;
                else $nuls++;
            }
        }

        return ['victoires' => $victoires, 'nuls' => $nuls, 'defaites' => $defaites];
    }

    private function getMoyenneButsSaison(int $teamId, int $competitionId, string $date)
    {
        $matchs = DB::table('matchs')
            ->where('competition_id', $competitionId)
            ->where(function ($query) use ($teamId) {
                $query->where('club_domicile_id', $teamId)
                      ->orWhere('club_exterieur_id', $teamId);
            })
            ->whereIn('statut', ['termine', 'homologue'])
            ->where('date_heure', '<', $date)
            ->get();

        if ($matchs->isEmpty()) {
            return ['marques' => 1.2, 'encaisses' => 1.2];
        }

        $totalMarques = 0;
        $totalEncaisses = 0;

        foreach ($matchs as $m) {
            $scoreDom = $m->score_domicile_officiel ?? $m->score_domicile_terrain;
            $scoreExt = $m->score_exterieur_officiel ?? $m->score_exterieur_terrain;

            if ($m->club_domicile_id == $teamId) {
                $totalMarques += $scoreDom;
                $totalEncaisses += $scoreExt;
            } else {
                $totalMarques += $scoreExt;
                $totalEncaisses += $scoreDom;
            }
        }

        $count = $matchs->count();
        return [
            'marques' => $totalMarques / $count,
            'encaisses' => $totalEncaisses / $count
        ];
    }

    private function getConfrontationsDirectes(int $homeId, int $awayId, string $date)
    {
        $matchs = DB::table('matchs')
            ->where(function ($query) use ($homeId, $awayId) {
                $query->where(function ($q) use ($homeId, $awayId) {
                    $q->where('club_domicile_id', $homeId)->where('club_exterieur_id', $awayId);
                })->orWhere(function ($q) use ($homeId, $awayId) {
                    $q->where('club_domicile_id', $awayId)->where('club_exterieur_id', $homeId);
                });
            })
            ->whereIn('statut', ['termine', 'homologue'])
            ->where('date_heure', '<', $date)
            ->get();

        $winDom = 0;
        $winExt = 0;
        $nuls = 0;

        foreach ($matchs as $m) {
            $scoreDom = $m->score_domicile_officiel ?? $m->score_domicile_terrain;
            $scoreExt = $m->score_exterieur_officiel ?? $m->score_exterieur_terrain;

            if ($scoreDom > $scoreExt) {
                $winnerId = $m->club_domicile_id;
            } elseif ($scoreDom < $scoreExt) {
                $winnerId = $m->club_exterieur_id;
            } else {
                $winnerId = null;
            }

            if ($winnerId === $homeId) {
                $winDom++;
            } elseif ($winnerId === $awayId) {
                $winExt++;
            } else {
                $nuls++;
            }
        }

        return ['win_dom' => $winDom, 'nuls' => $nuls, 'win_ext' => $winExt];
    }
}

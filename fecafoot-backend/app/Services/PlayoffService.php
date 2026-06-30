<?php

namespace App\Services;

use App\Models\Competition;
use App\Models\Phase;
use App\Models\Poule;
use App\Models\Club;
use App\Models\ClassementClub;
use Illuminate\Support\Facades\DB;

class PlayoffService
{
    protected ClassementService $classementService;

    public function __construct(ClassementService $classementService)
    {
        $this->classementService = $classementService;
    }

    /**
     * Génère automatiquement les phases et les poules de playoffs pour une compétition.
     */
    public function genererPlayoffs(int $competitionId): array
    {
        $competition = Competition::with(['saison', 'regles', 'phases.poules'])->findOrFail($competitionId);
        $regles = $competition->regles;

        // 1. Vérifications réglementaires
        if (!$regles) {
            throw new \Exception("Les règles de la compétition doivent être configurées avant de générer les playoffs.");
        }

        if (!$regles->a_playoffs) {
            throw new \Exception("Les playoffs ne sont pas configurés pour cette compétition (a_playoffs = false).");
        }

        // Vérifier que la phase régulière est terminée et gelée
        $phaseReguliere = $competition->phases->where('type', 'reguliere')->first();
        if (!$phaseReguliere) {
            throw new \Exception("Aucune phase régulière trouvée pour cette compétition.");
        }

        // Toutes les poules de la phase régulière doivent être gelées (classement finalisé)
        foreach ($phaseReguliere->poules as $poule) {
            if (!$poule->classement_gele) {
                throw new \Exception("Le classement de la poule '{$poule->nom}' doit être gelé avant de générer les playoffs.");
            }
        }

        // 2. Extraire les qualifiés UP et DOWN
        $qualifiesUp = $this->obtenirQualifies($phaseReguliere, $regles->nb_clubs_playoffs_up, 'top');
        $qualifiesDown = $this->obtenirQualifies($phaseReguliere, $regles->nb_clubs_playoffs_down, 'bottom');

        if (count($qualifiesUp) < 4 && count($qualifiesDown) < 4) {
            throw new \Exception("Il n'y a pas assez de clubs qualifiés pour générer des playoffs significatifs (minimum 4 requis).");
        }

        $phasesCreees = [];

        return DB::transaction(function () use ($competition, $phaseReguliere, $regles, $qualifiesUp, $qualifiesDown, &$phasesCreees) {
            $saisonId = $competition->saison->id;

            // 3. Créer ou récupérer la phase Playoffs UP
            if (count($qualifiesUp) >= 4) {
                $phaseUp = Phase::updateOrCreate(
                    [
                        'competition_id' => $competition->id,
                        'type'           => 'playoff_up',
                    ],
                    [
                        'nom'          => 'Playoffs UP (Titre)',
                        'ordre'        => $phaseReguliere->ordre + 1,
                        'statut'       => 'configure',
                        'est_terminee' => false,
                    ]
                );

                // Créer la poule unique de Playoffs UP
                $pouleUp = Poule::updateOrCreate(
                    [
                        'phase_id' => $phaseUp->id,
                        'nom'      => 'Poule Titre',
                    ],
                    [
                        'nb_equipes' => count($qualifiesUp),
                    ]
                );

                // Affecter les clubs à la poule
                $pouleUp->clubs()->detach();
                foreach ($qualifiesUp as $index => $clubId) {
                    $pouleUp->clubs()->attach($clubId, [
                        'saison_id'        => $saisonId,
                        'ordre_tirage'     => $index + 1,
                        'date_affectation' => now(),
                    ]);

                    // Reporter les points si configuré
                    $this->initialiserClassementPlayoff($clubId, $pouleUp->id, $phaseReguliere->id, $saisonId, $regles->points_reportes_playoffs);
                }

                $phasesCreees[] = $phaseUp;
            }

            // 4. Créer ou récupérer la phase Playoffs DOWN
            if (count($qualifiesDown) >= 4) {
                $phaseDown = Phase::updateOrCreate(
                    [
                        'competition_id' => $competition->id,
                        'type'           => 'playoff_down',
                    ],
                    [
                        'nom'          => 'Playoffs DOWN (Maintien)',
                        'ordre'        => $phaseReguliere->ordre + 2,
                        'statut'       => 'configure',
                        'est_terminee' => false,
                    ]
                );

                // Créer la poule unique de Playoffs DOWN
                $pouleDown = Poule::updateOrCreate(
                    [
                        'phase_id' => $phaseDown->id,
                        'nom'      => 'Poule Relégation',
                    ],
                    [
                        'nb_equipes' => count($qualifiesDown),
                    ]
                );

                // Affecter les clubs
                $pouleDown->clubs()->detach();
                foreach ($qualifiesDown as $index => $clubId) {
                    $pouleDown->clubs()->attach($clubId, [
                        'saison_id'        => $saisonId,
                        'ordre_tirage'     => $index + 1,
                        'date_affectation' => now(),
                    ]);

                    // Reporter les points si configuré
                    $this->initialiserClassementPlayoff($clubId, $pouleDown->id, $phaseReguliere->id, $saisonId, $regles->points_reportes_playoffs);
                }

                $phasesCreees[] = $phaseDown;
            }

            return [
                'success' => true,
                'message' => "Playoffs générés avec succès. " . count($phasesCreees) . " phase(s) créée(s).",
                'phases'  => $phasesCreees,
            ];
        });
    }

    /**
     * Obtient la liste des clubs qualifiés (UP ou DOWN).
     */
    private function obtenirQualifies(Phase $phaseReguliere, int $nbClubsTotal, string $type): array
    {
        $poules = $phaseReguliere->poules;
        $nbPoules = $poules->count();
        if ($nbPoules === 0 || $nbClubsTotal === 0) {
            return [];
        }

        $nbParPoule = (int) ceil($nbClubsTotal / $nbPoules);
        $clubsQualifies = [];

        foreach ($poules as $poule) {
            $query = ClassementClub::where('poule_id', $poule->id)
                ->where('saison_id', $phaseReguliere->competition->saison_id);

            if ($type === 'top') {
                // Les premiers
                $classements = $query->orderBy('position', 'asc')->take($nbParPoule)->get();
            } else {
                // Les derniers
                $classements = $query->orderBy('position', 'desc')->take($nbParPoule)->get();
            }

            foreach ($classements as $c) {
                $clubsQualifies[] = $c->club_id;
            }
        }

        // S'assurer de ne pas dépasser le nombre de clubs total alloué (si arrondi au-dessus)
        return array_slice(array_unique($clubsQualifies), 0, $nbClubsTotal);
    }

    /**
     * Initialise la ligne de classement pour le playoff en reportant ou non les points.
     */
    private function initialiserClassementPlayoff(int $clubId, int $poulePlayoffId, int $phaseReguliereId, int $saisonId, bool $reportPoints): void
    {
        $stats = [
            'nb_matchs'       => 0,
            'victoires'       => 0,
            'nuls'            => 0,
            'defaites'        => 0,
            'buts_pour'       => 0,
            'buts_contre'     => 0,
            'diff_buts'       => 0,
            'points'          => 0,
            'cartons_jaunes'  => 0,
            'cartons_rouges'  => 0,
            'points_penalite' => 0,
            'position'        => 0,
        ];

        if ($reportPoints) {
            // Rechercher le classement de la phase régulière
            $classementRegulier = ClassementClub::whereHas('poule', function($q) use ($phaseReguliereId) {
                $q->where('phase_id', $phaseReguliereId);
            })
            ->where('club_id', $clubId)
            ->where('saison_id', $saisonId)
            ->first();

            if ($classementRegulier) {
                $stats = [
                    'nb_matchs'       => $classementRegulier->nb_matchs,
                    'victoires'       => $classementRegulier->victoires,
                    'nuls'            => $classementRegulier->nuls,
                    'defaites'        => $classementRegulier->defaites,
                    'buts_pour'       => $classementRegulier->buts_pour,
                    'buts_contre'     => $classementRegulier->buts_contre,
                    'diff_buts'       => $classementRegulier->diff_buts,
                    'points'          => $classementRegulier->points,
                    'cartons_jaunes'  => $classementRegulier->cartons_jaunes,
                    'cartons_rouges'  => $classementRegulier->cartons_rouges,
                    'points_penalite' => $classementRegulier->points_penalite,
                    'position'        => 0,
                ];
            }
        }

        ClassementClub::updateOrCreate(
            [
                'club_id'   => $clubId,
                'poule_id'  => $poulePlayoffId,
                'saison_id' => $saisonId,
            ],
            $stats
        );
    }
}

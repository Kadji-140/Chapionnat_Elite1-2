<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Saison;
use App\Models\ClassementClub;
use App\Models\Poule;
use App\Services\PlayoffService;
use Illuminate\Http\Request;

class PlayoffController extends Controller
{
    protected PlayoffService $playoffService;

    public function __construct(PlayoffService $playoffService)
    {
        $this->playoffService = $playoffService;
    }

    /**
     * Configuration et statut des playoffs pour une compétition.
     */
    public function statutPlayoffs(Request $request, int $competitionId)
    {
        $competition = Competition::with(['regles', 'phases'])->findOrFail($competitionId);
        
        $hasPlayoffsUp = $competition->phases->where('type', 'playoff_up')->first() !== null;
        $hasPlayoffsDown = $competition->phases->where('type', 'playoff_down')->first() !== null;

        return response()->json([
            'success' => true,
            'data'    => [
                'competition_id'           => $competition->id,
                'competition_nom'          => $competition->nom,
                'a_playoffs_configure'     => $competition->regles->a_playoffs ?? false,
                'nb_clubs_playoffs_up'     => $competition->regles->nb_clubs_playoffs_up ?? 0,
                'nb_clubs_playoffs_down'   => $competition->regles->nb_clubs_playoffs_down ?? 0,
                'points_reportes_playoffs' => $competition->regles->points_reportes_playoffs ?? false,
                'playoffs_up_generes'      => $hasPlayoffsUp,
                'playoffs_down_generes'    => $hasPlayoffsDown,
            ],
        ]);
    }

    /**
     * Clubs qualifiés pour les playoffs (UP et DOWN).
     */
    public function clubsQualifies(Request $request, int $competitionId)
    {
        $competition = Competition::with(['regles', 'phases.poules'])->findOrFail($competitionId);
        $regles = $competition->regles;

        if (!$regles || !$regles->a_playoffs) {
            return response()->json(['success' => false, 'message' => 'Les playoffs ne sont pas configurés pour cette compétition.'], 400);
        }

        $phaseReguliere = $competition->phases->where('type', 'reguliere')->first();
        if (!$phaseReguliere) {
            return response()->json(['success' => false, 'message' => 'Aucune phase régulière trouvée.'], 404);
        }

        // Simuler ou obtenir les qualifiés
        $poules = $phaseReguliere->poules;
        $nbPoules = $poules->count();
        if ($nbPoules === 0) {
            return response()->json(['success' => true, 'qualifies_up' => [], 'qualifies_down' => []]);
        }

        $nbUp = (int) ceil(($regles->nb_clubs_playoffs_up ?? 0) / $nbPoules);
        $nbDown = (int) ceil(($regles->nb_clubs_playoffs_down ?? 0) / $nbPoules);

        $qualifiesUp = [];
        $qualifiesDown = [];

        foreach ($poules as $poule) {
            // Qualifiés UP (les premiers)
            $up = ClassementClub::where('poule_id', $poule->id)
                ->where('saison_id', $competition->saison_id)
                ->with('club')
                ->orderBy('position', 'asc')
                ->take($nbUp)
                ->get();
            
            // Qualifiés DOWN (les derniers)
            $down = ClassementClub::where('poule_id', $poule->id)
                ->where('saison_id', $competition->saison_id)
                ->with('club')
                ->orderBy('position', 'desc')
                ->take($nbDown)
                ->get();

            foreach ($up as $c) {
                $qualifiesUp[] = [
                    'club_id'  => $c->club_id,
                    'club_nom' => $c->club->nom ?? 'Inconnu',
                    'club_logo'=> $c->club->logo_url ?? null,
                    'poule'    => $poule->nom,
                    'position' => $c->position,
                ];
            }

            foreach ($down as $c) {
                $qualifiesDown[] = [
                    'club_id'  => $c->club_id,
                    'club_nom' => $c->club->nom ?? 'Inconnu',
                    'club_logo'=> $c->club->logo_url ?? null,
                    'poule'    => $poule->nom,
                    'position' => $c->position,
                ];
            }
        }

        return response()->json([
            'success'        => true,
            'qualifies_up'   => array_slice($qualifiesUp, 0, $regles->nb_clubs_playoffs_up),
            'qualifies_down' => array_slice($qualifiesDown, 0, $regles->nb_clubs_playoffs_down),
        ]);
    }

    /**
     * Générer les playoffs automatiquement (admin).
     */
    public function genererPlayoffs(Request $request, int $competitionId)
    {
        try {
            $result = $this->playoffService->genererPlayoffs($competitionId);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de génération : ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Bilan fin de saison : promotions et relégations.
     */
    public function promotionsRelegations(Request $request, int $saisonId)
    {
        $saison = Saison::findOrFail($saisonId);

        // Récupérer Elite One et Elite Two
        $compEliteOne = Competition::where('saison_id', $saisonId)->where('niveau', 'elite_one')->with('regles')->first();
        $compEliteTwo = Competition::where('saison_id', $saisonId)->where('niveau', 'elite_two')->with('regles')->first();

        $promus = [];
        $relegues = [];
        $barrages = [];

        // 1. Relégués d'Elite One (les derniers)
        if ($compEliteOne) {
            $reglesOne = $compEliteOne->regles;
            $nbRelegues = $reglesOne->nb_relegues_directs ?? 2;
            
            // Si des playoffs DOWN existent, on prend les derniers des playoffs DOWN
            $phaseDown = $compEliteOne->phases()->where('type', 'playoff_down')->first();
            $pouleId = null;

            if ($phaseDown) {
                $poule = Poule::where('phase_id', $phaseDown->id)->first();
                $pouleId = $poule->id ?? null;
            } else {
                // Sinon on prend la phase régulière
                $phaseReg = $compEliteOne->phases()->where('type', 'reguliere')->first();
                $poule = Poule::where('phase_id', $phaseReg->id ?? 0)->first();
                $pouleId = $poule->id ?? null;
            }

            if ($pouleId) {
                $releguesClubs = ClassementClub::where('poule_id', $pouleId)
                    ->where('saison_id', $saisonId)
                    ->with('club')
                    ->orderBy('position', 'desc')
                    ->take($nbRelegues)
                    ->get();

                foreach ($releguesClubs as $rc) {
                    $relegues[] = [
                        'club_id'  => $rc->club_id,
                        'club_nom' => $rc->club->nom ?? 'Inconnu',
                        'club_logo'=> $rc->club->logo_url ?? null,
                        'motif'    => 'Descente directe en division inférieure',
                    ];
                }
            }
        }

        // 2. Promus d'Elite Two (les premiers)
        if ($compEliteTwo) {
            $reglesTwo = $compEliteTwo->regles;
            $nbPromus = $reglesTwo->nb_promus_directs ?? 2;

            // Si des playoffs UP existent, on prend les premiers
            $phaseUp = $compEliteTwo->phases()->where('type', 'playoff_up')->first();
            $pouleId = null;

            if ($phaseUp) {
                $poule = Poule::where('phase_id', $phaseUp->id)->first();
                $pouleId = $poule->id ?? null;
            } else {
                $phaseReg = $compEliteTwo->phases()->where('type', 'reguliere')->first();
                $poule = Poule::where('phase_id', $phaseReg->id ?? 0)->first();
                $pouleId = $poule->id ?? null;
            }

            if ($pouleId) {
                $promusClubs = ClassementClub::where('poule_id', $pouleId)
                    ->where('saison_id', $saisonId)
                    ->with('club')
                    ->orderBy('position', 'asc')
                    ->take($nbPromus)
                    ->get();

                foreach ($promusClubs as $pc) {
                    $promus[] = [
                        'club_id'  => $pc->club_id,
                        'club_nom' => $pc->club->nom ?? 'Inconnu',
                        'club_logo'=> $pc->club->logo_url ?? null,
                        'motif'    => 'Montée directe en division supérieure',
                    ];
                }
            }
        }

        return response()->json([
            'success'  => true,
            'saison'   => $saison->intitule,
            'promus'   => $promus,
            'relegues' => $relegues,
            'barrages' => $barrages,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCompetitionRequest;
use App\Http\Requests\Admin\StoreReglesCompetitionRequest;
use App\Http\Resources\CompetitionResource;
use App\Http\Resources\ReglesCompetitionResource;
use App\Models\Competition;
use App\Models\Saison;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompetitionController extends Controller
{
    /**
     * GET /api/admin/saisons/{saison}/competitions
     */
    public function index(int $saisonId): JsonResponse
    {
        $saison = Saison::findOrFail($saisonId);
        $competitions = $saison->competitions()->with('regles', 'phases.poules')->get();

        return response()->json([
            'success' => true,
            'data'    => CompetitionResource::collection($competitions),
        ]);
    }

    /**
     * POST /api/admin/saisons/{saison}/competitions
     * Créer une compétition (ou initialiser les deux en une seule requête).
     */
    public function store(StoreCompetitionRequest $request, int $saisonId): JsonResponse
    {
        $saison = Saison::findOrFail($saisonId);

        // Vérifier unicité
        $existante = $saison->competitions()->where('niveau', $request->niveau)->first();
        if ($existante) {
            return response()->json([
                'success' => false,
                'message' => "Une compétition {$request->niveau} existe déjà pour cette saison.",
            ], 422);
        }

        $competition = Competition::create([
            'saison_id' => $saison->id,
            'niveau'    => $request->niveau,
            'nom'       => $request->nom,
            'statut'    => 'planifiee',
        ]);

        // Règles par défaut selon le niveau
        $competition->regles()->create($this->reglesParDefaut($request->niveau));

        $competition->load('regles');

        return response()->json([
            'success' => true,
            'message' => 'Compétition créée.',
            'data'    => new CompetitionResource($competition),
        ], 201);
    }

    /**
     * POST /api/admin/saisons/{saison}/competitions/initialiser
     * Crée automatiquement Elite One + Elite Two avec règles par défaut.
     */
    public function initialiser(int $saisonId): JsonResponse
    {
        $saison = Saison::with('competitions')->findOrFail($saisonId);
        $niveaux = ['elite_one', 'elite_two'];
        $created = [];

        foreach ($niveaux as $niveau) {
            if (!$saison->competitions->where('niveau', $niveau)->first()) {
                $nom = $niveau === 'elite_one' ? 'MTN Elite One ' . $saison->intitule : 'Elite Two ' . $saison->intitule;
                $competition = Competition::create([
                    'saison_id' => $saison->id,
                    'niveau'    => $niveau,
                    'nom'       => $nom,
                    'statut'    => 'planifiee',
                ]);
                $competition->regles()->create($this->reglesParDefaut($niveau));
                $competition->load('regles');
                $created[] = $competition;
            }
        }

        if (empty($created)) {
            return response()->json([
                'success' => false,
                'message' => 'Les deux compétitions existent déjà.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => count($created) . ' compétition(s) initialisée(s).',
            'data'    => CompetitionResource::collection($created),
        ], 201);
    }

    /**
     * GET /api/admin/competitions/{competition}
     */
    public function show(int $id): JsonResponse
    {
        $competition = Competition::with('regles', 'phases.poules.clubs', 'saison')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => new CompetitionResource($competition),
        ]);
    }

    /**
     * PUT /api/admin/competitions/{competition}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $competition = Competition::findOrFail($id);
        $competition->update($request->only(['nom', 'statut']));

        return response()->json([
            'success' => true,
            'message' => 'Compétition mise à jour.',
            'data'    => new CompetitionResource($competition),
        ]);
    }

    /**
     * GET /api/admin/competitions/{competition}/regles
     */
    public function getRegles(int $id): JsonResponse
    {
        $competition = Competition::with('regles')->findOrFail($id);

        if (!$competition->regles) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune règle configurée pour cette compétition.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new ReglesCompetitionResource($competition->regles),
        ]);
    }

    /**
     * PUT /api/admin/competitions/{competition}/regles
     * Crée ou met à jour les règles (upsert).
     */
    public function updateRegles(StoreReglesCompetitionRequest $request, int $id): JsonResponse
    {
        $competition = Competition::findOrFail($id);

        // Calculer nb_matchs_par_club automatiquement
        $nbClubs = $request->nb_clubs;
        $nbPoules = $request->nb_poules ?? 1;
        $clubsParPoule = $nbPoules > 0 ? floor($nbClubs / $nbPoules) : $nbClubs;
        $nbMatchsParClub = ($clubsParPoule - 1) * 2;

        $data = array_merge($request->validated(), [
            'competition_id'   => $competition->id,
            'nb_matchs_par_club' => $nbMatchsParClub,
        ]);

        $regles = $competition->regles()->updateOrCreate(
            ['competition_id' => $competition->id],
            $data
        );

        return response()->json([
            'success' => true,
            'message' => 'Règles mises à jour.',
            'data'    => new ReglesCompetitionResource($regles),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────

    private function reglesParDefaut(string $niveau): array
    {
        if ($niveau === 'elite_one') {
            return [
                'nb_clubs'                 => 12,
                'format'                   => 'poule_unique',
                'nb_poules'                => 1,
                'nb_matchs_par_club'       => 22,
                'a_playoffs'               => true,
                'nb_clubs_playoffs_up'     => 4,
                'nb_clubs_playoffs_down'   => 4,
                'points_reportes_playoffs' => false,
                'a_barrage'                => true,
                'nb_clubs_barrage'         => 2,
                'nb_promus_directs'        => 0,
                'nb_relegues_directs'      => 2,
                'criteres_egalite'         => ['points', 'diff_buts', 'buts_pour', 'confrontation_directe'],
                'points_victoire'          => 3,
                'points_nul'               => 1,
                'points_defaite'           => 0,
                'score_forfait_vainqueur'  => 3,
                'score_forfait_perdant'    => 0,
                'points_penalite_forfait'  => 0,
            ];
        }

        // Elite Two
        return [
            'nb_clubs'                 => 16,
            'format'                   => 'poules_multiples',
            'nb_poules'                => 2,
            'nb_matchs_par_club'       => 14,
            'a_playoffs'               => true,
            'nb_clubs_playoffs_up'     => 6,
            'nb_clubs_playoffs_down'   => 10,
            'points_reportes_playoffs' => false,
            'a_barrage'                => true,
            'nb_clubs_barrage'         => 2,
            'nb_promus_directs'        => 2,
            'nb_relegues_directs'      => 2,
            'criteres_egalite'         => ['points', 'diff_buts', 'buts_pour', 'confrontation_directe'],
            'points_victoire'          => 3,
            'points_nul'               => 1,
            'points_defaite'           => 0,
            'score_forfait_vainqueur'  => 3,
            'score_forfait_perdant'    => 0,
            'points_penalite_forfait'  => 0,
        ];
    }
}

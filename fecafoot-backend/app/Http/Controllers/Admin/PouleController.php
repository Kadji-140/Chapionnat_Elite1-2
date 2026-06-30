<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PouleResource;
use App\Models\Club;
use App\Models\Phase;
use App\Models\Poule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PouleController extends Controller
{
    /**
     * GET /api/admin/phases/{phase}/poules
     */
    public function index(int $phaseId): JsonResponse
    {
        $phase = Phase::findOrFail($phaseId);
        $poules = $phase->poules()->with('clubs')->get();

        return response()->json([
            'success' => true,
            'data'    => PouleResource::collection($poules),
        ]);
    }

    /**
     * POST /api/admin/phases/{phase}/poules
     * Créer une poule manuellement.
     */
    public function store(Request $request, int $phaseId): JsonResponse
    {
        $request->validate([
            'nom'        => ['required', 'string', 'max:100'],
            'nb_equipes' => ['required', 'integer', 'min:2'],
        ]);

        $phase = Phase::findOrFail($phaseId);
        $poule = $phase->poules()->create([
            'nom'        => $request->nom,
            'nb_equipes' => $request->nb_equipes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Poule créée.',
            'data'    => new PouleResource($poule),
        ], 201);
    }

    /**
     * POST /api/admin/poules/{poule}/affecter-clubs
     * Affecter manuellement des clubs à une poule.
     */
    public function affecterClubs(Request $request, int $pouleId): JsonResponse
    {
        $request->validate([
            'club_ids'   => ['required', 'array'],
            'club_ids.*' => ['integer', 'exists:clubs,id'],
        ]);

        $poule = Poule::with('phase.competition.saison')->findOrFail($pouleId);
        $saisonId = $poule->phase->competition->saison->id;

        // Synchroniser les clubs avec les métadonnées pivot
        $syncData = [];
        foreach ($request->club_ids as $index => $clubId) {
            $syncData[$clubId] = [
                'saison_id'      => $saisonId,
                'ordre_tirage'   => $index + 1,
                'date_affectation' => now()->toDateString(),
            ];
        }

        $poule->clubs()->sync($syncData);

        $poule->load('clubs');

        return response()->json([
            'success' => true,
            'message' => count($request->club_ids) . ' club(s) affecté(s) à la poule.',
            'data'    => new PouleResource($poule),
        ]);
    }

    /**
     * POST /api/admin/poules/{poule}/tirage-aleatoire
     * Tirage au sort aléatoire et équitable des clubs dans les poules d'une phase.
     */
    public function tirageAleatoire(Request $request, int $pouleId): JsonResponse
    {
        $request->validate([
            'division' => ['required', 'in:elite_one,elite_two'],
        ]);

        $poule = Poule::with('phase.competition.saison.competitions.phases.poules')->findOrFail($pouleId);
        $phase = $poule->phase;
        $saison = $phase->competition->saison;
        $division = $request->division;

        // Récupérer tous les clubs de la division
        $clubs = Club::where('division', $division)
            ->where('est_actif', true)
            ->get()
            ->shuffle();

        // Récupérer toutes les poules de cette phase
        $poules = $phase->poules()->with('clubs')->get();

        if ($poules->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune poule trouvée pour cette phase.',
            ], 422);
        }

        // Répartir équitablement
        $clubsParPoule = $clubs->chunk((int) ceil($clubs->count() / $poules->count()));

        foreach ($poules as $i => $p) {
            $clubsChunk = $clubsParPoule->get($i, collect());
            $syncData = [];
            foreach ($clubsChunk as $index => $club) {
                $syncData[$club->id] = [
                    'saison_id'        => $saison->id,
                    'ordre_tirage'     => $index + 1,
                    'date_affectation' => now()->toDateString(),
                ];
            }
            $p->clubs()->sync($syncData);
        }

        $phase->load('poules.clubs');

        return response()->json([
            'success' => true,
            'message' => 'Tirage au sort effectué. ' . $clubs->count() . ' club(s) répartis dans ' . $poules->count() . ' poule(s).',
            'data'    => PouleResource::collection($phase->poules),
        ]);
    }
}

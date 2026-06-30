<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSaisonRequest;
use App\Http\Requests\Admin\UpdateSaisonRequest;
use App\Http\Resources\SaisonResource;
use App\Models\Competition;
use App\Models\Phase;
use App\Models\Saison;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaisonController extends Controller
{
    /**
     * GET /api/admin/saisons
     * Liste paginée des saisons.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Saison::withCount('competitions')
            ->with('competitions')
            ->orderByDesc('created_at');

        if ($request->has('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        $saisons = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data'    => SaisonResource::collection($saisons->items()),
            'meta'    => [
                'current_page' => $saisons->currentPage(),
                'last_page'    => $saisons->lastPage(),
                'per_page'     => $saisons->perPage(),
                'total'        => $saisons->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/saisons
     * Créer une nouvelle saison.
     */
    public function store(StoreSaisonRequest $request): JsonResponse
    {
        $clonerId = $request->cloner_depuis_id;

        $saison = Saison::create([
            'intitule'         => $request->intitule,
            'date_debut'       => $request->date_debut,
            'date_fin'         => $request->date_fin,
            'statut'           => 'planifiee',
            'clonee_depuis_id' => $clonerId,
        ]);

        // Si clonage, on recopie les compétitions et leurs règles
        if ($clonerId) {
            $this->clonerConfiguration($clonerId, $saison);
        }

        $saison->load('competitions');

        return response()->json([
            'success' => true,
            'message' => 'Saison créée avec succès.',
            'data'    => new SaisonResource($saison),
        ], 201);
    }

    /**
     * GET /api/admin/saisons/{saison}
     * Détail complet d'une saison.
     */
    public function show(int $id): JsonResponse
    {
        $saison = Saison::with([
            'competitions.regles',
            'competitions.phases.poules.clubs',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => new SaisonResource($saison),
        ]);
    }

    /**
     * PUT /api/admin/saisons/{saison}
     * Modifier une saison (uniquement si planifiée).
     */
    public function update(UpdateSaisonRequest $request, int $id): JsonResponse
    {
        $saison = Saison::findOrFail($id);

        if ($saison->statut !== 'planifiee') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les saisons planifiées peuvent être modifiées.',
            ], 422);
        }

        $saison->update($request->only(['intitule', 'date_debut', 'date_fin']));

        return response()->json([
            'success' => true,
            'message' => 'Saison mise à jour.',
            'data'    => new SaisonResource($saison),
        ]);
    }

    /**
     * DELETE /api/admin/saisons/{saison}
     * Supprimer une saison planifiée.
     */
    public function destroy(int $id): JsonResponse
    {
        $saison = Saison::findOrFail($id);

        if ($saison->statut !== 'planifiee') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les saisons planifiées peuvent être supprimées.',
            ], 422);
        }

        $saison->delete();

        return response()->json([
            'success' => true,
            'message' => 'Saison supprimée.',
        ]);
    }

    /**
     * PATCH /api/admin/saisons/{saison}/activer
     * Activer une saison (la passer en_cours).
     */
/**
 * PATCH /api/admin/saisons/{saison}/activer
 * Activer une saison (la passer en_cours).
 */
public function activer(int $id): JsonResponse
{
    $saison = Saison::with('competitions.regles', 'competitions.phases.poules.clubs')->findOrFail($id);

    if ($saison->statut !== 'planifiee') {
        return response()->json([
            'success' => false,
            'message' => 'Seules les saisons planifiées peuvent être activées.',
        ], 422);
    }

    // Vérifications préalables
    $errors = [];

    $competitions = $saison->competitions;
    if ($competitions->count() < 2) {
        $errors[] = 'Les deux compétitions (Elite One et Elite Two) doivent être configurées.';
    }

    foreach ($competitions as $comp) {
        if (!$comp->regles) {
            $errors[] = "Les règles de la compétition \"{$comp->nom}\" ne sont pas configurées.";
        }

        $phases = $comp->phases;
        if ($phases->isEmpty()) {
            $errors[] = "Les phases de la compétition \"{$comp->nom}\" n'ont pas été générées.";
            continue;
        }

        // ⭐⭐⭐ MODIFICATION ICI : On ne vérifie que la PHASE RÉGULIÈRE ⭐⭐⭐
        $phaseReguliere = $phases->firstWhere('type', 'reguliere');
        
        if (!$phaseReguliere) {
            $errors[] = "La phase régulière de la compétition \"{$comp->nom}\" n'existe pas.";
            continue;
        }

        foreach ($phaseReguliere->poules as $poule) {
            if ($poule->clubs->count() < 2) {
                $errors[] = "La poule \"{$poule->nom}\" de la compétition \"{$comp->nom}\" doit contenir au moins 2 clubs.";
            }
        }
    }

    if (!empty($errors)) {
        return response()->json([
            'success' => false,
            'message' => 'Impossible d\'activer la saison.',
            'errors'  => $errors,
        ], 422);
    }

    // Archiver la saison en cours s'il y en a une
    Saison::where('statut', 'en_cours')->update(['statut' => 'terminee']);

    $saison->update(['statut' => 'en_cours']);

    return response()->json([
        'success' => true,
        'message' => 'Saison activée avec succès.',
        'data'    => new SaisonResource($saison),
    ]);
}

    /**
     * PATCH /api/admin/saisons/{saison}/cloturer
     * Clôturer une saison.
     */
    public function cloturer(int $id): JsonResponse
    {
        $saison = Saison::findOrFail($id);

        if ($saison->statut !== 'en_cours') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les saisons en cours peuvent être clôturées.',
            ], 422);
        }

        $saison->update(['statut' => 'terminee']);

        return response()->json([
            'success' => true,
            'message' => 'Saison clôturée avec succès.',
            'data'    => new SaisonResource($saison),
        ]);
    }

    /**
     * POST /api/admin/saisons/{saison}/cloner
     * Cloner la configuration d'une saison vers une nouvelle.
     */
    public function cloner(StoreSaisonRequest $request, int $id): JsonResponse
    {
        $source = Saison::findOrFail($id);

        $nouvelle = Saison::create([
            'intitule'         => $request->intitule,
            'date_debut'       => $request->date_debut,
            'date_fin'         => $request->date_fin,
            'statut'           => 'planifiee',
            'clonee_depuis_id' => $source->id,
        ]);

        $this->clonerConfiguration($source->id, $nouvelle);

        $nouvelle->load('competitions.regles');

        return response()->json([
            'success' => true,
            'message' => 'Saison clonée avec succès.',
            'data'    => new SaisonResource($nouvelle),
        ], 201);
    }

    // ── Helpers privés ────────────────────────────────────────────

    private function clonerConfiguration(int $sourceId, Saison $destination): void
    {
        $source = Saison::with('competitions.regles')->findOrFail($sourceId);

        foreach ($source->competitions as $comp) {
            $newComp = Competition::create([
                'saison_id' => $destination->id,
                'niveau'    => $comp->niveau,
                'nom'       => $comp->nom,
                'statut'    => 'planifiee',
            ]);

            if ($comp->regles) {
                $reglesData = $comp->regles->toArray();
                unset($reglesData['id'], $reglesData['competition_id'], $reglesData['created_at'], $reglesData['updated_at']);
                $newComp->regles()->create(array_merge($reglesData, ['competition_id' => $newComp->id]));
            }
        }
    }
}

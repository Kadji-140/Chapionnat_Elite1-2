<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreArbitreRequest;
use App\Http\Requests\Admin\UpdateArbitreRequest;
use App\Http\Resources\ArbitreResource;
use App\Models\Arbitre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Gestion des arbitres par l'administrateur FECAFOOT.
 * Préfixe : /api/admin/arbitres
 */
class ArbitreController extends Controller
{
    /**
     * GET /api/admin/arbitres
     * Liste paginée avec filtres.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Arbitre::withCount('matchs');

        // Filtre par spécification
        if ($request->filled('specification')) {
            $query->where('specification', $request->specification);
        }

        // Filtre par région
        if ($request->filled('region')) {
            $query->where('region', 'like', '%' . $request->region . '%');
        }

        // Filtre par statut actif
        if ($request->filled('actif')) {
            $query->where('actif', filter_var($request->actif, FILTER_VALIDATE_BOOLEAN));
        }

        // Filtre par disponibilité
        if ($request->filled('disponible')) {
            $query->where('disponible', filter_var($request->disponible, FILTER_VALIDATE_BOOLEAN));
        }

        // Recherche par nom
        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', $search)
                  ->orWhere('prenom', 'like', $search)
                  ->orWhere('num_licence', 'like', $search);
            });
        }

        $query->orderBy('nom');
        $arbitres = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => ArbitreResource::collection($arbitres->items()),
            'meta'    => [
                'total'        => $arbitres->total(),
                'current_page' => $arbitres->currentPage(),
                'last_page'    => $arbitres->lastPage(),
                'per_page'     => $arbitres->perPage(),
            ],
        ]);
    }

    /**
     * POST /api/admin/arbitres
     */
    public function store(StoreArbitreRequest $request): JsonResponse
    {
        $arbitre = Arbitre::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Arbitre enregistré avec succès.',
            'data'    => new ArbitreResource($arbitre),
        ], 201);
    }

    /**
     * GET /api/admin/arbitres/{id}
     */
    public function show(int $id): JsonResponse
    {
        $arbitre = Arbitre::withCount('matchs')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => new ArbitreResource($arbitre),
        ]);
    }

    /**
     * PUT /api/admin/arbitres/{id}
     */
    public function update(UpdateArbitreRequest $request, int $id): JsonResponse
    {
        $arbitre = Arbitre::findOrFail($id);
        $arbitre->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Arbitre mis à jour avec succès.',
            'data'    => new ArbitreResource($arbitre),
        ]);
    }

    /**
     * DELETE /api/admin/arbitres/{id}
     * Soft delete / désactivation.
     */
    public function destroy(int $id): JsonResponse
    {
        $arbitre = Arbitre::findOrFail($id);
        $arbitre->update(['actif' => false]);

        return response()->json([
            'success' => true,
            'message' => "L'arbitre a été désactivé.",
        ]);
    }

    /**
     * PATCH /api/admin/arbitres/{id}/toggle
     * Bascule l'état actif/inactif.
     */
    public function toggle(int $id): JsonResponse
    {
        $arbitre = Arbitre::findOrFail($id);
        $arbitre->update(['actif' => !$arbitre->actif]);

        return response()->json([
            'success' => true,
            'message' => $arbitre->actif ? 'Arbitre activé.' : 'Arbitre désactivé.',
            'actif'   => $arbitre->actif,
        ]);
    }
}

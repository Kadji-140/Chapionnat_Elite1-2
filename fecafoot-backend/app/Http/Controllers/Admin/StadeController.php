<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Stade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Gestion des stades par l'administrateur FECAFOOT.
 * Préfixe : /api/admin/stades
 */
class StadeController extends Controller
{
    /**
     * GET /api/admin/stades
     */
    public function index(Request $request): JsonResponse
    {
        $query = Stade::query();

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', $search)
                  ->orWhere('ville', 'like', $search);
            });
        }

        if ($request->filled('ville')) {
            $query->where('ville', $request->ville);
        }

        if ($request->filled('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        $query->orderBy('nom');

        if ($request->boolean('all')) {
            $stades = $query->get();
            return response()->json([
                'success' => true,
                'data'    => $stades,
            ]);
        }

        $stades = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $stades->items(),
            'meta'    => [
                'total'        => $stades->total(),
                'current_page' => $stades->currentPage(),
                'last_page'    => $stades->lastPage(),
                'per_page'     => $stades->perPage(),
            ],
        ]);
    }

    /**
     * POST /api/admin/stades
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom'       => ['required', 'string', 'max:255', 'unique:stades,nom'],
            'ville'     => ['required', 'string', 'max:255'],
            'capacite'  => ['nullable', 'integer', 'min:0'],
            'est_actif' => ['boolean'],
        ]);

        $stade = Stade::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Stade créé avec succès.',
            'data'    => $stade,
        ], 201);
    }

    /**
     * GET /api/admin/stades/{id}
     */
    public function show(int $id): JsonResponse
    {
        $stade = Stade::findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $stade,
        ]);
    }

    /**
     * PUT /api/admin/stades/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $stade = Stade::findOrFail($id);

        $validated = $request->validate([
            'nom'       => ['required', 'string', 'max:255', 'unique:stades,nom,' . $id],
            'ville'     => ['required', 'string', 'max:255'],
            'capacite'  => ['nullable', 'integer', 'min:0'],
            'est_actif' => ['boolean'],
        ]);

        $stade->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Stade mis à jour avec succès.',
            'data'    => $stade,
        ]);
    }

    /**
     * DELETE /api/admin/stades/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $stade = Stade::findOrFail($id);
        $stade->delete();

        return response()->json([
            'success' => true,
            'message' => 'Stade supprimé avec succès.',
        ]);
    }

    /**
     * PATCH /api/admin/stades/{id}/toggle
     */
    public function toggle(int $id): JsonResponse
    {
        $stade = Stade::findOrFail($id);
        $stade->update(['est_actif' => !$stade->est_actif]);

        return response()->json([
            'success' => true,
            'message' => $stade->est_actif ? 'Stade activé.' : 'Stade désactivé.',
            'est_actif' => $stade->est_actif,
        ]);
    }
}

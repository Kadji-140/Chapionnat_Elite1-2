<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejeterJoueurRequest;
use App\Http\Resources\JoueurResource;
use App\Models\Club;
use App\Models\Joueur;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Validation des licences joueurs par l'admin FECAFOOT.
 * Préfixe : /api/admin/joueurs
 */
class JoueurController extends Controller
{
    /**
     * GET /api/admin/joueurs
     * Liste tous les joueurs avec filtres.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Joueur::with('club')->orderBy('created_at', 'desc');

        if ($request->filled('club_id')) {
            $query->where('club_id', $request->club_id);
        }

        if ($request->filled('statut_validation')) {
            $query->where('statut_validation', $request->statut_validation);
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', $search)
                  ->orWhere('prenom', 'like', $search)
                  ->orWhere('num_licence', 'like', $search);
            });
        }

        $joueurs = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => JoueurResource::collection($joueurs->items()),
            'meta'    => [
                'total'        => $joueurs->total(),
                'current_page' => $joueurs->currentPage(),
                'last_page'    => $joueurs->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/admin/joueurs/en-attente
     * Liste des clubs avec leurs joueurs soumis en attente de validation.
     * Format accordéon : clubs regroupés avec leurs joueurs.
     */
    public function enAttente(): JsonResponse
    {
        $clubs = Club::with([
                'joueurs' => fn ($q) => $q->where('statut_validation', 'en_attente')
                                          ->where('est_soumis', true)
                                          ->orderBy('num_maillot'),
            ])
            ->whereHas('joueurs', fn ($q) => $q->where('statut_validation', 'en_attente')
                                               ->where('est_soumis', true))
            ->get();

        $data = $clubs->map(fn ($club) => [
            'club' => [
                'id'       => $club->id,
                'nom'      => $club->nom,
                'logo_url' => $club->logo_url ? asset('storage/' . $club->logo_url) : null,
                'division' => $club->division,
            ],
            'nb_en_attente' => $club->joueurs->count(),
            'joueurs'       => JoueurResource::collection($club->joueurs),
        ]);

        return response()->json([
            'success'       => true,
            'data'          => $data,
            'total_attente' => $data->sum('nb_en_attente'),
        ]);
    }

    /**
     * PATCH /api/admin/joueurs/{id}/valider
     * Valide la licence d'un joueur.
     */
    public function valider(int $id): JsonResponse
    {
        $joueur = Joueur::with('club.responsable')->findOrFail($id);

        if ($joueur->statut_validation === 'valide') {
            return response()->json([
                'success' => false,
                'message' => 'Ce joueur est déjà validé.',
            ], 422);
        }

        $joueur->update([
            'statut_validation' => 'valide',
            'motif_rejet'       => null,
        ]);

        // Notifier le responsable du club
        if ($joueur->club?->responsable_id) {
            NotificationService::joueurValide(
                responsableId: $joueur->club->responsable_id,
                nomJoueur:     "{$joueur->prenom} {$joueur->nom}",
                nomClub:       $joueur->club->nom,
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Le joueur {$joueur->prenom} {$joueur->nom} a été validé.",
            'data'    => new JoueurResource($joueur),
        ]);
    }

    /**
     * PATCH /api/admin/joueurs/{id}/rejeter
     * Rejette un joueur avec un motif obligatoire.
     */
    public function rejeter(RejeterJoueurRequest $request, int $id): JsonResponse
    {
        $joueur = Joueur::with('club.responsable')->findOrFail($id);

        $joueur->update([
            'statut_validation' => 'rejete',
            'motif_rejet'       => $request->motif,
            'est_soumis'        => false,
        ]);

        // Notifier le responsable du club
        if ($joueur->club?->responsable_id) {
            NotificationService::joueurRejete(
                responsableId: $joueur->club->responsable_id,
                nomJoueur:     "{$joueur->prenom} {$joueur->nom}",
                motif:         $request->motif,
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Le joueur {$joueur->prenom} {$joueur->nom} a été rejeté.",
            'data'    => new JoueurResource($joueur),
        ]);
    }
}

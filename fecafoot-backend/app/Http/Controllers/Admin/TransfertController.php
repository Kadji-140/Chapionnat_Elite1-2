<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transfert;
use App\Models\Joueur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

/**
 * Modération des transferts côté Ligue (Admin).
 * Préfixe : /api/admin/transferts
 */
class TransfertController extends Controller
{
    /**
     * GET /api/admin/transferts
     * Liste toutes les demandes de transfert.
     */
    public function index(Request $request): JsonResponse
    {
        $transferts = Transfert::with(['joueur', 'clubCedant', 'clubAcquereur', 'saison', 'validePar'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $transferts,
        ]);
    }

    /**
     * PATCH /api/admin/transferts/{id}/valider
     * Valide une demande de transfert et met à jour le club du joueur.
     */
    public function valider(Request $request, $id): JsonResponse
    {
        $transfert = Transfert::findOrFail($id);

        if ($transfert->statut !== 'en_attente') {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande de transfert a déjà été traitée.',
            ], 422);
        }

        $joueur = $transfert->joueur;
        if (!$joueur) {
            return response()->json([
                'success' => false,
                'message' => 'Le joueur concerné n\'existe pas.',
            ], 422);
        }

        // Exécuter la validation et le transfert du joueur de manière transactionnelle
        DB::transaction(function () use ($transfert, $joueur, $request) {
            $transfert->update([
                'statut'           => 'valide',
                'valide_par_id'    => $request->user()->id,
                'date_validation'  => now(),
            ]);

            // Mutation : assigner le joueur au club acquéreur
            $joueur->update([
                'club_id' => $transfert->club_acquereur_id,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Le transfert a été validé avec succès. Le joueur a été affecté à son nouveau club.',
            'data'    => $transfert->load(['joueur', 'clubCedant', 'clubAcquereur', 'saison', 'validePar']),
        ]);
    }

    /**
     * PATCH /api/admin/transferts/{id}/rejeter
     * Rejette une demande de transfert.
     */
    public function rejeter(Request $request, $id): JsonResponse
    {
        $transfert = Transfert::findOrFail($id);

        if ($transfert->statut !== 'en_attente') {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande de transfert a déjà été traitée.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'motif_rejet' => 'required|string|min:5|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $transfert->update([
            'statut'           => 'rejete',
            'motif_rejet'      => $request->motif_rejet,
            'valide_par_id'    => $request->user()->id,
            'date_validation'  => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'La demande de transfert a été rejetée.',
            'data'    => $transfert->load(['joueur', 'clubCedant', 'clubAcquereur', 'saison', 'validePar']),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Responsable;

use App\Http\Controllers\Controller;
use App\Models\Transfert;
use App\Models\Joueur;
use App\Models\Club;
use App\Models\Saison;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Gestion des demandes de transfert côté club.
 * Préfixe : /api/responsable/transferts
 */
class TransfertController extends Controller
{
    /**
     * GET /api/responsable/transferts
     * Liste les transferts sortants et entrants du club.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $transferts = Transfert::with(['joueur', 'clubCedant', 'clubAcquereur', 'saison'])
            ->where(function ($query) use ($user) {
                $query->where('club_cedant_id', $user->club_id)
                      ->orWhere('club_acquereur_id', $user->club_id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $transferts,
        ]);
    }

    /**
     * POST /api/responsable/transferts
     * Soumet une nouvelle demande de transfert d'un joueur.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'joueur_id'          => 'required|exists:joueurs,id',
            'club_acquereur_id'  => 'required|exists:clubs,id',
            'montant'            => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Récupérer la saison en cours
        $saison = Saison::where('statut', 'en_cours')->first();
        if (!$saison) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune saison active (en cours) pour effectuer un transfert.',
            ], 422);
        }

        // Vérifier le joueur
        $joueur = Joueur::where('id', $request->joueur_id)->first();

        // Le joueur doit appartenir au club cédant
        if ($joueur->club_id !== $user->club_id) {
            return response()->json([
                'success' => false,
                'message' => 'Ce joueur n\'appartient pas à votre club.',
            ], 403);
        }

        // Le joueur doit être validé par la ligue
        if ($joueur->statut_validation !== 'valide') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les joueurs validés par la FECAFOOT peuvent être transférés.',
            ], 422);
        }

        // Club acquéreur
        $clubAcquereur = Club::find($request->club_acquereur_id);
        if (!$clubAcquereur->est_actif) {
            return response()->json([
                'success' => false,
                'message' => 'Le club acquéreur n\'est pas actif.',
            ], 422);
        }

        // Les deux clubs doivent être différents
        if ($clubAcquereur->id === $user->club_id) {
            return response()->json([
                'success' => false,
                'message' => 'Le club acquéreur doit être différent du club cédant.',
            ], 422);
        }

        // Vérifier s'il n'y a pas déjà un transfert en cours pour ce joueur
        $transfertEnCours = Transfert::where('joueur_id', $joueur->id)
            ->where('statut', 'en_attente')
            ->exists();

        if ($transfertEnCours) {
            return response()->json([
                'success' => false,
                'message' => 'Une demande de transfert est déjà en cours de validation pour ce joueur.',
            ], 422);
        }

        // Créer la demande de transfert
        $transfert = Transfert::create([
            'joueur_id'          => $joueur->id,
            'club_cedant_id'     => $user->club_id,
            'club_acquereur_id'  => $clubAcquereur->id,
            'saison_id'          => $saison->id,
            'montant'            => $request->montant,
            'statut'             => 'en_attente',
            'date_demande'       => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'La demande de transfert a bien été soumise et est en attente de validation.',
            'data'    => $transfert->load(['joueur', 'clubCedant', 'clubAcquereur', 'saison']),
        ], 201);
    }
}

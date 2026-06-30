<?php

namespace App\Http\Controllers\Responsable;

use App\Http\Controllers\Controller;
use App\Http\Requests\Responsable\StoreJoueurRequest;
use App\Http\Resources\JoueurResource;
use App\Models\Club;
use App\Models\Joueur;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Gestion des joueurs du club par le responsable.
 * Préfixe : /api/responsable/joueurs
 */
class JoueurController extends Controller
{
    /**
     * GET /api/responsable/joueurs
     * Liste les joueurs du club du responsable connecté.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $joueurs = Joueur::where('club_id', $user->club_id)
            ->when($request->filled('statut_validation'), fn ($q) => $q->where('statut_validation', $request->statut_validation))
            ->when($request->filled('poste'), fn ($q) => $q->where('poste', $request->poste))
            ->orderBy('num_maillot')
            ->get();

        // Statistiques rapides
        $stats = [
            'total'       => $joueurs->count(),
            'valides'     => $joueurs->where('statut_validation', 'valide')->count(),
            'en_attente'  => $joueurs->where('statut_validation', 'en_attente')->count(),
            'rejetes'     => $joueurs->where('statut_validation', 'rejete')->count(),
            'soumis'      => $joueurs->where('est_soumis', true)->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => JoueurResource::collection($joueurs),
            'stats'   => $stats,
        ]);
    }

    /**
     * POST /api/responsable/joueurs
     * Ajoute un joueur au club (statut "en_attente" par défaut).
     */
    public function store(StoreJoueurRequest $request): JsonResponse
    {
        $user = $request->user();

        // Upload de la photo du joueur
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('joueurs', 'public');
        }

        $joueur = Joueur::create([
            'club_id'           => $user->club_id,
            'nom'               => $request->nom,
            'prenom'            => $request->prenom,
            'date_naissance'    => $request->date_naissance,
            'nationalite'       => $request->nationalite,
            'num_licence'       => $request->num_licence,
            'poste'             => $request->poste,
            'num_maillot'       => $request->num_maillot,
            'photo_url'         => $photoPath,
            'taille_cm'         => $request->taille_cm,
            'poids_kg'          => $request->poids_kg,
            'statut'            => 'actif',
            'statut_validation' => 'en_attente',
            'est_soumis'        => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Le joueur {$joueur->prenom} {$joueur->nom} a été ajouté. Il sera validé par l'administration.",
            'data'    => new JoueurResource($joueur),
        ], 201);
    }

    /**
     * PUT /api/responsable/joueurs/{id}
     * Modifie un joueur du club.
     * Règles :
     *  - Si validé : tous les champs sont modifiables SAUF num_licence (licence définitive)
     *  - Si rejeté : tous les champs modifiables + repasse en en_attente
     *  - Si en_attente : tous les champs modifiables
     */
    public function update(StoreJoueurRequest $request, int $id): JsonResponse
    {
        $user   = $request->user();
        $joueur = Joueur::where('id', $id)
            ->where('club_id', $user->club_id)
            ->firstOrFail();

        // Gestion de la photo
        $photoPath = $joueur->photo_url;
        if ($request->hasFile('photo')) {
            if ($photoPath) {
                Storage::disk('public')->delete($photoPath);
            }
            $photoPath = $request->file('photo')->store('joueurs', 'public');
        }

        // Si le joueur est validé, le num_licence ne peut plus être modifié
        $numLicence = $joueur->statut_validation === 'valide'
            ? $joueur->num_licence      // Conserver l'ancien numéro
            : $request->num_licence;    // Accepter le nouveau numéro

        // Déterminer le nouveau statut de validation
        $statutValidation = match ($joueur->statut_validation) {
            'rejete' => 'en_attente',   // Rejeté + modifié → retour en attente
            default  => $joueur->statut_validation, // Garder le statut actuel (valide ou en_attente)
        };

        $joueur->update([
            'nom'            => $request->nom,
            'prenom'         => $request->prenom,
            'date_naissance' => $request->date_naissance,
            'nationalite'    => $request->nationalite,
            'num_licence'    => $numLicence,
            'poste'          => $request->poste,
            'num_maillot'    => $request->num_maillot,
            'photo_url'      => $photoPath,
            'taille_cm'      => $request->taille_cm,
            'poids_kg'       => $request->poids_kg,
            'statut_validation' => $statutValidation,
            'motif_rejet'       => $joueur->statut_validation === 'rejete' ? null : $joueur->motif_rejet,
            'est_soumis'        => $joueur->statut_validation === 'valide' ? $joueur->est_soumis : false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Joueur mis à jour avec succès.',
            'data'    => new JoueurResource($joueur->fresh()),
        ]);
    }

    /**
     * DELETE /api/responsable/joueurs/{id}
     * Supprime un joueur (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user   = $request->user();
        $joueur = Joueur::where('id', $id)
            ->where('club_id', $user->club_id)
            ->firstOrFail();

        $nomComplet = "{$joueur->prenom} {$joueur->nom}";

        // Supprimer la photo associée
        if ($joueur->photo_url) {
            Storage::disk('public')->delete($joueur->photo_url);
        }

        $joueur->delete();

        return response()->json([
            'success' => true,
            'message' => "Le joueur {$nomComplet} a été supprimé.",
        ]);
    }

    /**
     * POST /api/responsable/joueurs/soumettre
     * Valide la composition puis soumet l'effectif à la FECAFOOT.
     * Règles : au moins 11 joueurs avec les postes obligatoires.
     */
    public function soumettre(Request $request): JsonResponse
    {
        $user = $request->user();

        // Récupérer tous les joueurs du club (y compris ceux déjà validés)
        $tousJoueurs = Joueur::where('club_id', $user->club_id)
            ->where('statut', 'actif')
            ->get();

        $nonSoumis = $tousJoueurs->where('statut_validation', 'en_attente')
            ->where('est_soumis', false);

        if ($nonSoumis->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun joueur en attente à soumettre.',
            ], 422);
        }

        // ── Validation composition (11 joueurs minimum) ──────────
        // Les groupes de postes couvrent tous les sous-postes (ex: defenseur_central, lateral_droit...)
        $GROUPES_REQUIS = [
            'Gardien'   => ['gardien'],
            'Défenseur' => ['defenseur_central', 'lateral_droit', 'lateral_gauche', 'defenseur'],
            'Milieu'    => ['milieu_defensif', 'milieu_central', 'milieu_offensif', 'milieu'],
            'Attaquant' => ['ailier_droit', 'ailier_gauche', 'attaquant_centre', 'avant_centre', 'attaquant'],
        ];
        $MIN_JOUEURS   = 11;

        $joueursValides = $tousJoueurs
            ->whereIn('statut_validation', ['valide', 'en_attente'])
            ->count();

        if ($joueursValides < $MIN_JOUEURS) {
            return response()->json([
                'success' => false,
                'message' => "L'effectif doit comporter au moins {$MIN_JOUEURS} joueurs. Actuellement : {$joueursValides}.",
                'details' => [
                    'joueurs_total' => $joueursValides,
                    'minimum_requis' => $MIN_JOUEURS,
                ],
            ], 422);
        }

        // Vérifier qu'au moins un joueur par groupe de poste obligatoire
        $postesManquants = [];
        foreach ($GROUPES_REQUIS as $nomGroupe => $postes) {
            $nb = $tousJoueurs->whereIn('statut_validation', ['valide', 'en_attente'])
                ->whereIn('poste', $postes)->count();
            if ($nb === 0) {
                $postesManquants[] = $nomGroupe;
            }
        }

        if (!empty($postesManquants)) {
            return response()->json([
                'success'          => false,
                'message'          => 'L\'effectif est incomplet. Des postes obligatoires manquent.',
                'postes_manquants' => $postesManquants,
            ], 422);
        }

        // ── Tout est OK : soumettre ──────────────────────────────
        $count = Joueur::where('club_id', $user->club_id)
            ->where('statut_validation', 'en_attente')
            ->where('est_soumis', false)
            ->update(['est_soumis' => true]);

        // Récupérer le club pour la notification
        $club = Club::find($user->club_id);

        // Notifier les admins (une seule notification groupée)
        if ($club) {
            NotificationService::effectifSoumis(
                clubId:     $club->id,
                nomClub:    $club->nom,
                nbJoueurs:  $count,
            );
        }

        return response()->json([
            'success' => true,
            'message' => "{$count} joueur(s) soumis à la validation de l'administration FECAFOOT.",
            'count'   => $count,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Responsable;

use App\Http\Controllers\Controller;
use App\Http\Requests\Responsable\CompleterProfilRequest;
use App\Http\Requests\Responsable\UpdateClubRequest;
use App\Http\Resources\ClubResource;
use App\Models\Notification;
use App\Models\User;
use App\Models\Rencontre;
use App\Models\ClassementClub;
use App\Models\Transfert;
use App\Models\Joueur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Gestion du club par le responsable.
 * Préfixe : /api/responsable
 */
class ClubController extends Controller
{
    /**
     * GET /api/responsable/mon-club
     * Retourne les infos du club du responsable connecté.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->club_id) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun club n\'est associé à votre compte.',
            ], 404);
        }

        $club = $user->club()->with('responsable')
            ->withCount([
                'joueurs as nb_joueurs',
                'joueurs as nb_joueurs_valides' => fn ($q) => $q->where('statut_validation', 'valide'),
                'joueurs as nb_joueurs_soumis'  => fn ($q) => $q->where('est_soumis', true),
                'coachs as nb_coachs',
            ])
            ->first();

        return response()->json([
            'success' => true,
            'data'    => new ClubResource($club),
        ]);
    }

    /**
     * POST /api/responsable/mon-club
     * Mise à jour des informations du club (stade, président, couleurs, logo, etc.).
     */
    public function update(UpdateClubRequest $request): JsonResponse
    {
        $user = $request->user();
        $club = $user->club;

        if (!$club) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun club n\'est associé à votre compte.',
            ], 404);
        }

        $logoPath = $club->logo_url;
        if ($request->hasFile('logo')) {
            if ($logoPath) {
                Storage::disk('public')->delete($logoPath);
            }
            $logoPath = $request->file('logo')->store('logos', 'public');
        }

        $clubData = array_filter($request->only([
            'stade', 'president', 'couleurs', 'annee_creation',
            'site_web', 'telephone', 'presentation',
        ]), fn ($v) => $v !== null);

        $club->update([...$clubData, 'logo_url' => $logoPath]);

        return response()->json([
            'success' => true,
            'message' => 'Informations du club mises à jour.',
            'data'    => new ClubResource($club),
        ]);
    }

    /**
     * POST /api/responsable/mon-club/completer-profil
     * Complétion du profil lors de la première connexion.
     * Met à jour profile_completed = true.
     */
    public function completerProfil(CompleterProfilRequest $request): JsonResponse
    {
        $user = $request->user();
        $club = $user->club;

        if (!$club) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun club n\'est associé à votre compte.',
            ], 404);
        }

        // Upload du logo si fourni
        $logoPath = $club->logo_url;
        if ($request->hasFile('logo')) {
            if ($logoPath) {
                Storage::disk('public')->delete($logoPath);
            }
            $logoPath = $request->file('logo')->store('logos', 'public');
        }

        // Mettre à jour le profil du club
        $club->update([
            'stade'             => $request->stade,
            'president'         => $request->president,
            'couleurs'          => $request->couleurs,
            'annee_creation'    => $request->annee_creation,
            'logo_url'          => $logoPath,
            'profile_completed' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profil du club complété avec succès. Bienvenue sur la plateforme FECAFOOT !',
            'data'    => new ClubResource($club),
        ]);
    }

    /**
     * POST /api/responsable/mon-club/signaler-erreur
     * Le responsable signale une erreur dans les informations de son club.
     */
    public function signalerErreur(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|min:5|max:500',
        ]);

        $user = $request->user();
        $club = $user->club;

        if (!$club) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun club n\'est associé à votre compte.',
            ], 404);
        }

        // Créer une notification pour tous les admins
        $admins = User::where('role', 'admin')->get();
        
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'signalement_club',
                'titre' => 'Signalement d\'erreur - ' . $club->nom,
                'message' => "Le responsable {$user->prenom} {$user->nom} a signalé une erreur :\n\n" . $request->message . "\n\nClub : {$club->nom} ({$club->ville})",
                'lue' => false,
                'envoyee_le' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Signalement envoyé à l\'administrateur.',
        ]);
    }

    /**
     * GET /api/responsable/dashboard-stats
     * Fournit les données détaillées pour le dashboard responsable (classement, matchs, transferts).
     */
    public function dashboardStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $club = $user->club;

        if (!$club) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun club associé à votre compte.',
            ], 404);
        }

        // 1. Prochain match (le plus proche dans le futur)
        $prochainMatch = Rencontre::with(['clubDomicile', 'clubExterieur', 'poule', 'phase.competition'])
            ->where(function ($q) use ($club) {
                $q->where('club_domicile_id', $club->id)
                  ->orWhere('club_exterieur_id', $club->id);
            })
            ->whereIn('statut', ['programme', 'reporte'])
            ->where('date_heure', '>=', now())
            ->orderBy('date_heure', 'asc')
            ->first();

        // 2. Derniers résultats (les 3 derniers matchs joués ou homologués)
        $derniersResultats = Rencontre::with(['clubDomicile', 'clubExterieur', 'poule', 'phase.competition'])
            ->where(function ($q) use ($club) {
                $q->where('club_domicile_id', $club->id)
                  ->orWhere('club_exterieur_id', $club->id);
            })
            ->whereIn('statut', ['termine', 'homologue'])
            ->orderBy('date_heure', 'desc')
            ->take(3)
            ->get();

        // 3. Classement du club
        $classement = ClassementClub::where('club_id', $club->id)
            ->with(['poule', 'saison'])
            ->first();

        // 4. Statistiques transferts (nombre de demandes en cours)
        $transfertsEnCours = Transfert::where(function ($q) use ($club) {
                $q->where('club_depart_id', $club->id)
                  ->orWhere('club_arrivee_id', $club->id);
            })
            ->where('statut', 'en_attente')
            ->count();

        // 5. Total joueurs et licences
        $nbJoueurs = Joueur::where('club_id', $club->id)->count();
        $nbJoueursValides = Joueur::where('club_id', $club->id)->where('statut_validation', 'valide')->count();
        $nbJoueursEnAttente = Joueur::where('club_id', $club->id)->where('statut_validation', 'en_attente')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'prochain_match' => $prochainMatch,
                'derniers_resultats' => $derniersResultats,
                'classement' => $classement,
                'transferts_en_cours' => $transfertsEnCours,
                'nb_joueurs' => $nbJoueurs,
                'nb_joueurs_valides' => $nbJoueursValides,
                'nb_joueurs_en_attente' => $nbJoueursEnAttente,
            ]
        ]);
    }
}
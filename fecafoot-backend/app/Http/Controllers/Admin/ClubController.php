<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreClubRequest;
use App\Http\Requests\Admin\UpdateClubRequest;
use App\Http\Resources\ClubResource;
use App\Mail\CompteCreeMail;
use App\Mail\ReinitialisationMotDePasseMail;
use App\Models\Club;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Gestion des clubs par l'administrateur FECAFOOT.
 * Préfixe : /api/admin/clubs
 */
class ClubController extends Controller
{
    /**
     * GET /api/admin/clubs
     * Liste paginée avec filtres : division, est_actif, search
     */
    public function index(Request $request): JsonResponse
    {
        $query = Club::query();

        if ($request->filled('include_deleted') && filter_var($request->include_deleted, FILTER_VALIDATE_BOOLEAN)) {
            $query->withTrashed();
        }

        $query->with('responsable')
            ->withCount([
                'joueurs as nb_joueurs',
                'joueurs as nb_joueurs_valides' => fn ($q) => $q->where('statut_validation', 'valide'),
                'coachs as nb_coachs',
            ]);

        // Filtre par division
        if ($request->filled('division')) {
            $query->where('division', $request->division);
        }

        // Filtre par statut actif/inactif
        if ($request->filled('actif')) {
            $query->where('est_actif', filter_var($request->actif, FILTER_VALIDATE_BOOLEAN));
        }

        // Recherche par nom ou ville
        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', $search)
                  ->orWhere('ville', 'like', $search);
            });
        }

        // Tri
        $query->orderBy($request->get('sort_by', 'nom'), $request->get('sort_dir', 'asc'));

        $clubs = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => ClubResource::collection($clubs->items()),
            'meta'    => [
                'total'        => $clubs->total(),
                'current_page' => $clubs->currentPage(),
                'last_page'    => $clubs->lastPage(),
                'per_page'     => $clubs->perPage(),
            ],
        ]);
    }

    /**
     * POST /api/admin/clubs
     * Crée un club + son compte responsable + envoie l'email de bienvenue.
     */
    public function store(StoreClubRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            // 1. Générer un mot de passe aléatoire sécurisé (10 caractères)
            $motDePasse = $this->genererMotDePasse();

            // 2. Créer ou récupérer le compte utilisateur du responsable
            // ⚠️ MODE TEST : Si l'email existe déjà, on réutilise le compte
            // (en production, l'unicité sera ré-activée dans StoreClubRequest)
            $responsable = User::firstOrCreate(
                ['email' => $request->email_responsable],
                [
                    'nom'                => $request->nom_responsable   ?? 'Responsable',
                    'prenom'             => $request->prenom_responsable ?? 'Club',
                    'password'           => Hash::make($motDePasse),
                    'role'               => 'responsable_club',
                    'premiere_connexion' => true,
                    'acces_actif'        => true,
                ]
            );

            // Si l'utilisateur existait déjà, on met à jour son rôle et son mot de passe
            $comptePreexistant = !$responsable->wasRecentlyCreated;
            if ($comptePreexistant) {
                $responsable->update([
                    'nom'                => $request->nom_responsable   ?? $responsable->nom,
                    'prenom'             => $request->prenom_responsable ?? $responsable->prenom,
                    'password'           => Hash::make($motDePasse),
                    'role'               => 'responsable_club',
                    'premiere_connexion' => true,
                    'acces_actif'        => true,
                ]);
            }

            // 3. Gérer l'upload du logo
            $logoPath = null;
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('logos', 'public');
            }

            // 4. Créer le club
            $club = Club::create([
                'nom'               => $request->nom,
                'ville'             => $request->ville,
                'division'          => $request->division,
                'logo_url'          => $logoPath,
                'responsable_id'    => $responsable->id,
                'est_actif'         => true,
                'profile_completed' => false,
            ]);

            // 5. Relier le responsable à son club
            $responsable->update(['club_id' => $club->id]);

            // 6. Envoyer l'email de bienvenue avec les identifiants
            try {
                Mail::to($responsable->email)->send(new CompteCreeMail(
                    nom: $responsable->nom,
                    prenom: $responsable->prenom,
                    email: $responsable->email,
                    motDePasse: $motDePasse,
                    role: 'responsable_club',
                    clubNom: $club->nom,
                ));
            } catch (\Exception $e) {
                // L'email échoue silencieusement — le club est quand même créé
                \Log::warning("Email non envoyé à {$responsable->email} : " . $e->getMessage());
            }

            $club->load('responsable');

            return response()->json([
                'success' => true,
                'message' => "Club \"{$club->nom}\" créé avec succès. Un email a été envoyé au responsable.",
                'data'    => new ClubResource($club),
            ], 201);
        });
    }

    /**
     * GET /api/admin/clubs/{id}
     * Détail complet d'un club avec joueurs et coachs.
     */
    public function show(int $id): JsonResponse
    {
        $club = Club::withTrashed()->with([
                'responsable',
                'joueurs' => fn ($q) => $q->orderBy('num_maillot'),
                'coachs',
            ])
            ->withCount([
                'joueurs as nb_joueurs',
                'joueurs as nb_joueurs_valides' => fn ($q) => $q->where('statut_validation', 'valide'),
                'coachs as nb_coachs',
            ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => new ClubResource($club),
            'joueurs' => \App\Http\Resources\JoueurResource::collection($club->joueurs),
            'coachs'  => $club->coachs->map(fn ($c) => [
                'id'          => $c->id,
                'nom'         => $c->nom,
                'prenom'      => $c->prenom,
                'email'       => $c->email,
                'acces_actif' => $c->acces_actif,
            ]),
        ]);
    }

    /**
     * PUT /api/admin/clubs/{id}
     * Modification d'un club. Si l'email responsable change, met à jour le User.
     */
    public function update(UpdateClubRequest $request, int $id): JsonResponse
    {
        $club = Club::findOrFail($id);

        return DB::transaction(function () use ($request, $club) {
            // Gestion du logo
            $logoPath = $club->logo_url;
            if ($request->hasFile('logo')) {
                // Supprimer l'ancien logo si existant
                if ($logoPath) {
                    Storage::disk('public')->delete($logoPath);
                }
                $logoPath = $request->file('logo')->store('logos', 'public');
            }

            // Mise à jour des infos du club
            $clubData = array_filter($request->only([
                'nom', 'ville', 'division', 'stade', 'president',
                'couleurs', 'annee_creation', 'site_web', 'telephone', 'presentation',
            ]), fn ($v) => $v !== null);

            $club->update([...$clubData, 'logo_url' => $logoPath]);

            // Mise à jour du responsable si les infos changent
            if ($club->responsable && ($request->filled('email_responsable') || $request->filled('nom_responsable'))) {
                $responsableData = [];
                if ($request->filled('email_responsable')) $responsableData['email'] = $request->email_responsable;
                if ($request->filled('nom_responsable'))   $responsableData['nom']   = $request->nom_responsable;
                if ($request->filled('prenom_responsable'))$responsableData['prenom']= $request->prenom_responsable;
                $club->responsable->update($responsableData);
            }

            $club->load('responsable');

            return response()->json([
                'success' => true,
                'message' => 'Club mis à jour avec succès.',
                'data'    => new ClubResource($club),
            ]);
        });
    }

    /**
     * DELETE /api/admin/clubs/{id}
     * Soft delete d'un club (désactivation).
     */
    public function destroy(int $id): JsonResponse
    {
        $club = Club::findOrFail($id);
        $club->update(['est_actif' => false]);

        // Désactiver le responsable
        if ($club->responsable) {
            $club->responsable->update(['acces_actif' => false]);
            $club->responsable->tokens()->delete();
        }

        // Désactiver les coachs
        foreach ($club->coachs as $coach) {
            $coach->update(['acces_actif' => false]);
            $coach->tokens()->delete();
        }

        $club->delete(); // Soft delete

        return response()->json([
            'success' => true,
            'message' => "Le club \"{$club->nom}\" a été désactivé. Le responsable et les coachs associés ont été désactivés.",
        ]);
    }

    /**
     * PATCH /api/admin/clubs/{id}/toggle
     * Réactive un club désactivé ou désactive un club actif.
     */
    public function toggle(int $id): JsonResponse
    {
        // Cherche aussi dans les soft-deleted pour réactiver
        $club = Club::withTrashed()->findOrFail($id);

        if ($club->trashed()) {
            $club->restore();
            $club->update(['est_actif' => true]);

            // Réactiver le responsable
            if ($club->responsable) {
                $club->responsable->update(['acces_actif' => true]);
            }
            // Réactiver les coachs
            foreach ($club->coachs as $coach) {
                $coach->update(['acces_actif' => true]);
            }

            $message = "Le club \"{$club->nom}\" a été réactivé.";
        } else {
            $club->update(['est_actif' => !$club->est_actif]);
            $isActive = $club->est_actif;

            if ($club->responsable) {
                $club->responsable->update(['acces_actif' => $isActive]);
                if (!$isActive) {
                    $club->responsable->tokens()->delete();
                }
            }
            foreach ($club->coachs as $coach) {
                $coach->update(['acces_actif' => $isActive]);
                if (!$isActive) {
                    $coach->tokens()->delete();
                }
            }

            $message = $isActive
                ? "Le club \"{$club->nom}\" est maintenant actif."
                : "Le club \"{$club->nom}\" a été désactivé.";
        }

        return response()->json([
            'success'   => true,
            'message'   => $message,
            'est_actif' => $club->fresh()->est_actif,
        ]);
    }

    /**
     * POST /api/admin/clubs/{id}/reset-password-responsable
     * Réinitialise le mot de passe du responsable et lui envoie un email.
     */
    public function resetPasswordResponsable(int $id): JsonResponse
    {
        $club = Club::with('responsable')->findOrFail($id);

        if (!$club->responsable) {
            return response()->json([
                'success' => false,
                'message' => 'Ce club n\'a pas de responsable assigné.',
            ], 404);
        }

        if (!$club->responsable->premiere_connexion) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de réinitialiser le mot de passe : l\'utilisateur a déjà effectué sa première connexion.',
            ], 400);
        }

        $nouveauMdp = $this->genererMotDePasse();
        $club->responsable->update([
            'password'           => Hash::make($nouveauMdp),
            'premiere_connexion' => true,
        ]);

        try {
            Mail::to($club->responsable->email)->send(new ReinitialisationMotDePasseMail(
                nom: $club->responsable->nom,
                prenom: $club->responsable->prenom,
                email: $club->responsable->email,
                motDePasse: $nouveauMdp,
            ));
        } catch (\Exception $e) {
            \Log::warning("Email reset MDP non envoyé : " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe réinitialisé. Un email a été envoyé au responsable.',
        ]);
    }

    /**
     * Génère un mot de passe aléatoire sécurisé de 10 caractères.
     * Inclut maj, min, chiffres et caractères spéciaux.
     */
    private function genererMotDePasse(): string
    {
        $majuscules  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $minuscules  = 'abcdefghjkmnpqrstuvwxyz';
        $chiffres    = '23456789';
        $speciaux    = '@#$%!';

        // Au moins un de chaque catégorie
        $mdp = $majuscules[rand(0, strlen($majuscules) - 1)]
             . $minuscules[rand(0, strlen($minuscules) - 1)]
             . $chiffres[rand(0, strlen($chiffres) - 1)]
             . $speciaux[rand(0, strlen($speciaux) - 1)];

        // Compléter jusqu'à 10 caractères avec tous les chars mélangés
        $tous = $majuscules . $minuscules . $chiffres . $speciaux;
        for ($i = 0; $i < 6; $i++) {
            $mdp .= $tous[rand(0, strlen($tous) - 1)];
        }

        // Mélanger les caractères (pour éviter un pattern prévisible)
        return str_shuffle($mdp);
    }
}

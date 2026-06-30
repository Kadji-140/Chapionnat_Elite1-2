<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Mail\CompteCreeMail;
use App\Mail\ReinitialisationMotDePasseMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

/**
 * Gestion des utilisateurs (commissaires, journalistes) par l'admin.
 * Préfixe : /api/admin/users
 */
class UserController extends Controller
{
    /**
     * GET /api/admin/users
     * Liste paginée avec filtre par rôle.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('club');

        // Filtre par rôle (exclut les admins de la liste par défaut)
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        } else {
            // Par défaut : tous les rôles sauf admin (géré séparément)
            $query->whereIn('role', ['responsable_club', 'coach', 'commissaire', 'journaliste']);
        }

        // Filtre par statut
        if ($request->filled('actif')) {
            $query->where('acces_actif', filter_var($request->actif, FILTER_VALIDATE_BOOLEAN));
        }

        // Recherche par nom ou email
        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', $search)
                  ->orWhere('prenom', 'like', $search)
                  ->orWhere('email', 'like', $search);
            });
        }

        $query->orderBy('created_at', 'desc');
        $users = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => UserResource::collection($users->items()),
            'meta'    => [
                'total'        => $users->total(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'per_page'     => $users->perPage(),
            ],
        ]);
    }

    /**
     * POST /api/admin/users
     * Crée un utilisateur (commissaire ou journaliste) et envoie l'email.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $motDePasse = $this->genererMotDePasse();

        $user = User::create([
            'nom'                => $request->nom,
            'prenom'             => $request->prenom,
            'email'              => $request->email,
            'password'           => Hash::make($motDePasse),
            'role'               => $request->role,
            'villes'             => $request->villes,
            'premiere_connexion' => true,
            'acces_actif'        => true,
        ]);

        // Envoyer l'email de bienvenue
        try {
            Mail::to($user->email)->send(new CompteCreeMail(
                nom: $user->nom,
                prenom: $user->prenom,
                email: $user->email,
                motDePasse: $motDePasse,
                role: $user->role,
            ));
        } catch (\Exception $e) {
            \Log::warning("Email non envoyé à {$user->email} : " . $e->getMessage());
        }

        // Retourner le mot de passe UNE SEULE FOIS (pour l'admin)
        return response()->json([
            'success'          => true,
            'message'          => 'Compte créé avec succès. Un email a été envoyé.',
            'data'             => new UserResource($user),
            'mot_de_passe_tmp' => $motDePasse, // Affiché une seule fois dans le frontend
        ], 201);
    }

    /**
     * GET /api/admin/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with('club')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => new UserResource($user),
        ]);
    }

    /**
     * PUT /api/admin/users/{id}
     */
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update($request->only(['nom', 'prenom', 'email', 'role', 'villes']));

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur mis à jour avec succès.',
            'data'    => new UserResource($user),
        ]);
    }

    /**
     * PATCH /api/admin/users/{id}/toggle
     * Active ou désactive un compte utilisateur.
     */
    public function toggle(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Protection : impossible de désactiver son propre compte
        if ($user->id === request()->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas désactiver votre propre compte.',
            ], 403);
        }

        $user->update(['acces_actif' => !$user->acces_actif]);

        // Révoquer les tokens si désactivation
        if (!$user->acces_actif) {
            $user->tokens()->delete();
        }

        return response()->json([
            'success'     => true,
            'message'     => $user->acces_actif ? 'Compte activé.' : 'Compte désactivé. Les sessions actives ont été révoquées.',
            'acces_actif' => $user->acces_actif,
        ]);
    }

    /**
     * POST /api/admin/users/{id}/reset-password
     * Réinitialise le mot de passe et envoie un email.
     */
    public function resetPassword(int $id): JsonResponse
    {
        $user       = User::findOrFail($id);

        if (!$user->premiere_connexion) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de réinitialiser le mot de passe : l\'utilisateur a déjà effectué sa première connexion.',
            ], 400);
        }

        $nouveauMdp = $this->genererMotDePasse();

        $user->update([
            'password'           => Hash::make($nouveauMdp),
            'premiere_connexion' => true,
        ]);

        // Révoquer tous les tokens (force reconnexion)
        $user->tokens()->delete();

        try {
            Mail::to($user->email)->send(new ReinitialisationMotDePasseMail(
                nom: $user->nom,
                prenom: $user->prenom,
                email: $user->email,
                motDePasse: $nouveauMdp,
            ));
        } catch (\Exception $e) {
            \Log::warning("Email reset MDP non envoyé à {$user->email} : " . $e->getMessage());
        }

        return response()->json([
            'success'          => true,
            'message'          => 'Mot de passe réinitialisé. Un email a été envoyé à l\'utilisateur.',
            'mot_de_passe_tmp' => $nouveauMdp,
        ]);
    }

    /**
     * Génère un mot de passe aléatoire sécurisé.
     */
    private function genererMotDePasse(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%!';
        $mdp   = '';
        for ($i = 0; $i < 10; $i++) {
            $mdp .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $mdp;
    }
}

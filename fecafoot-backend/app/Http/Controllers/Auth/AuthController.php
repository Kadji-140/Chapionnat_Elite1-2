<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;



class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     * Connecte un utilisateur et retourne un token Sanctum
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // Chercher l'utilisateur par email
        $user = User::where('email', $request->email)
                    ->whereNull('deleted_at')
                    ->first();
 
        // Vérifier que l'utilisateur existe et que le mot de passe est correct
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect.',
            ], 401);
        }
 
        // Vérifier que le compte est actif
        if (!$user->acces_actif) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte a été désactivé. Contactez l\'administrateur.',
            ], 403);
        }

        // Vérifier que le club associé est actif
        if ($user->club_id) {
            $club = \App\Models\Club::withTrashed()->find($user->club_id);
            if (!$club || !$club->est_actif || $club->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le club associé à votre compte a été désactivé. Contactez l\'administrateur.',
                ], 403);
            }
        }
 
        // Mettre à jour la dernière activité
        $user->update(['date_derniere_activite' => now()]);
 
        // Révoquer les anciens tokens (une seule session à la fois)
        $user->tokens()->delete();
 
        // Créer un nouveau token Sanctum avec le nom du rôle
        $token = $user->createToken(
            name: "session_{$user->role}",
            expiresAt: now()->addHours(8) // Token valide 8h
        )->plainTextToken;
 
        return response()->json([
            'success'            => true,
            'message'            => 'Connexion réussie.',
            'token'              => $token,
            'token_type'         => 'Bearer',
            'premiere_connexion' => $user->premiere_connexion,
            'user'               => new UserResource($user),
        ]);
    }
 
    /**
     * POST /api/auth/logout
     * Déconnecte l'utilisateur (révoque le token courant)
     */
    public function logout(Request $request): JsonResponse
    {
        // Révoquer uniquement le token utilisé pour cette requête
        $request->user()->currentAccessToken()->delete();
 
        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie.',
        ]);
    }
 
    /**
     * GET /api/auth/me
     * Retourne les informations de l'utilisateur connecté
     */
    public function me(Request $request): JsonResponse
    {
        // Charger les relations nécessaires
        $user = $request->user()->load('club');
 
        // Mettre à jour la dernière activité
        $user->update(['date_derniere_activite' => now()]);
 
        return response()->json([
            'success' => true,
            'user'    => new UserResource($user),
        ]);
    }

    /**
     * PUT /api/auth/lang
     * Modifie la langue de l'utilisateur connecté
     */
    public function updateLang(Request $request): JsonResponse
    {
        $request->validate([
            'lang' => 'required|string|in:fr,en',
        ]);

        $user = $request->user();
        $user->update(['lang' => $request->lang]);

        return response()->json([
            'success' => true,
            'message' => 'Langue mise à jour avec succès.',
            'user'    => new UserResource($user),
        ]);
    }
 
    /**
     * POST /api/auth/change-password
     * Changement de mot de passe (obligatoire à la première connexion)
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
 
        // Vérifier l'ancien mot de passe
        if (!Hash::check($request->ancien_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'L\'ancien mot de passe est incorrect.',
                'errors'  => ['ancien_password' => ['L\'ancien mot de passe est incorrect.']],
            ], 422);
        }
 
        // Mettre à jour le mot de passe et lever le flag premiere_connexion
        $user->update([
            'password'           => Hash::make($request->nouveau_password),
            'premiere_connexion' => false,
        ]);
 
        // Révoquer tous les autres tokens (forcer reconnexion sur autres appareils)
        $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();
 
        return response()->json([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès.',
            'user'    => new UserResource($user),
        ]);
    }
 
    /**
     * POST /api/auth/refresh
     * Renouvelle le token (appelé automatiquement par le frontend)
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
 
        // Révoquer le token actuel
        $request->user()->currentAccessToken()->delete();
 
        // Créer un nouveau token
        $token = $user->createToken(
            name: "session_{$user->role}",
            expiresAt: now()->addHours(8)
        )->plainTextToken;
 
        $user->update(['date_derniere_activite' => now()]);
 
        return response()->json([
            'success'    => true,
            'token'      => $token,
            'token_type' => 'Bearer',
        ]);
    }










    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
{
    $status = Password::sendResetLink($request->only('email'));

    if ($status === Password::RESET_LINK_SENT) {
        return response()->json([
            'success' => true,
            'message' => 'Un lien de réinitialisation a été envoyé à votre adresse email.',
        ]);
    }

    return response()->json([
        'success' => false,
        'message' => 'Impossible d\'envoyer l\'email. Veuillez réessayer.',
    ], 422);
}

public function resetPassword(ResetPasswordRequest $request): JsonResponse
{
    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function (User $user, string $password) {
            $user->forceFill([
                'password'           => Hash::make($password),
                'premiere_connexion' => false,
                'remember_token'     => Str::random(60),
            ])->save();

            $user->tokens()->delete();
            event(new PasswordReset($user));
        }
    );

    if ($status === Password::PASSWORD_RESET) {
        return response()->json([
            'success' => true,
            'message' => 'Mot de passe réinitialisé avec succès.',
        ]);
    }

    return response()->json([
        'success' => false,
        'message' => 'Lien invalide ou expiré.',
    ], 422);
}


}

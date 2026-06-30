<?php

namespace App\Http\Controllers\Responsable;

use App\Http\Controllers\Controller;
use App\Http\Requests\Responsable\StoreCoachRequest;
use App\Mail\CompteCreeMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

/**
 * Gestion des coachs du club par le responsable.
 * Préfixe : /api/responsable/coachs
 */
class CoachController extends Controller
{
    /**
     * GET /api/responsable/coachs
     * Liste les coachs du club du responsable connecté.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $coachs = User::where('club_id', $user->club_id)
            ->where('role', 'coach')
            ->whereNull('deleted_at')
            ->orderBy('nom')
            ->get()
            ->map(fn ($c) => [
                'id'                 => $c->id,
                'nom'                => $c->nom,
                'prenom'             => $c->prenom,
                'nom_complet'        => "{$c->prenom} {$c->nom}",
                'email'              => $c->email,
                'acces_actif'        => $c->acces_actif,
                'premiere_connexion' => $c->premiere_connexion,
                'created_at'         => $c->created_at?->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'data'    => $coachs,
        ]);
    }

    /**
     * POST /api/responsable/coachs
     * Crée un compte coach pour ce club et envoie l'email de bienvenue.
     */
    public function store(StoreCoachRequest $request): JsonResponse
    {
        $user = $request->user();

        // Générer un mot de passe temporaire
        $motDePasse = $this->genererMotDePasse();

        // Créer le compte coach
        $coach = User::create([
            'nom'                => $request->nom,
            'prenom'             => $request->prenom,
            'email'              => $request->email,
            'password'           => Hash::make($motDePasse),
            'role'               => 'coach',
            'club_id'            => $user->club_id,
            'premiere_connexion' => true,
            'acces_actif'        => true,
        ]);

        // Envoyer l'email de bienvenue
        try {
            Mail::to($coach->email)->send(new CompteCreeMail(
                nom: $coach->nom,
                prenom: $coach->prenom,
                email: $coach->email,
                motDePasse: $motDePasse,
                role: 'coach',
                clubNom: $user->club?->nom,
            ));
        } catch (\Exception $e) {
            \Log::warning("Email coach non envoyé à {$coach->email} : " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "Le coach {$coach->prenom} {$coach->nom} a été ajouté. Un email avec ses identifiants lui a été envoyé.",
            'data'    => [
                'id'          => $coach->id,
                'nom'         => $coach->nom,
                'prenom'      => $coach->prenom,
                'nom_complet' => "{$coach->prenom} {$coach->nom}",
                'email'       => $coach->email,
                'acces_actif' => $coach->acces_actif,
            ],
        ], 201);
    }

    /**
     * PATCH /api/responsable/coachs/{id}/toggle
     * Active ou désactive l'accès d'un coach.
     */
    public function toggle(Request $request, int $id): JsonResponse
    {
        $user  = $request->user();
        $coach = User::where('id', $id)
            ->where('club_id', $user->club_id)
            ->where('role', 'coach')
            ->firstOrFail();

        $coach->update(['acces_actif' => !$coach->acces_actif]);

        // Révoquer les tokens si désactivation
        if (!$coach->acces_actif) {
            $coach->tokens()->delete();
        }

        return response()->json([
            'success'     => true,
            'message'     => $coach->acces_actif ? 'Accès coach activé.' : 'Accès coach désactivé.',
            'acces_actif' => $coach->acces_actif,
        ]);
    }

    /**
     * DELETE /api/responsable/coachs/{id}
     * Retire un coach du club (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user  = $request->user();
        $coach = User::where('id', $id)
            ->where('club_id', $user->club_id)
            ->where('role', 'coach')
            ->firstOrFail();

        // Révoquer les tokens et dissocier du club
        $coach->tokens()->delete();
        $coach->update(['club_id' => null, 'acces_actif' => false]);
        $coach->delete(); // Soft delete

        return response()->json([
            'success' => true,
            'message' => "Le coach {$coach->prenom} {$coach->nom} a été retiré du club.",
        ]);
    }

    /**
     * Génère un mot de passe aléatoire sécurisé de 10 caractères.
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

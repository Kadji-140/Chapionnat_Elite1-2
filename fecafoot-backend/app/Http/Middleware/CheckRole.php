<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Vérifier que l'utilisateur est connecté
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.'
            ], 401);
        }
 
        // Vérifier que le compte est actif
        if (!$request->user()->acces_actif) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte a été désactivé. Contactez l\'administrateur.'
            ], 403);
        }

        // Vérifier que le club associé est actif
        if ($request->user()->club_id) {
            $club = \App\Models\Club::withTrashed()->find($request->user()->club_id);
            if (!$club || !$club->est_actif || $club->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le club associé à votre compte a été désactivé. Contactez l\'administrateur.'
                ], 403);
            }
        }
 
        // Vérifier le rôle
        if (!in_array($request->user()->role, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
            ], 403);
        }
 
        return $next($request);
    }
}

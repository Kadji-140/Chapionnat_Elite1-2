<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPremiereConnexion
{
   public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
 
        if ($user && $user->premiere_connexion) {
            // Autorise seulement la route de changement de mot de passe
            if ($request->routeIs('auth.change-password')) {
                return $next($request);
            }
 
            return response()->json([
                'success'            => false,
                'message'            => 'Vous devez changer votre mot de passe avant de continuer.',
                'premiere_connexion' => true,
            ], 403);
        }
 
        return $next($request);
    }
}

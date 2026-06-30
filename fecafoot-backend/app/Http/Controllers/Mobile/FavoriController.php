<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\FavoriClub;
use App\Models\FavoriJoueur;
use App\Models\Joueur;
use App\Models\MobileUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FavoriController extends Controller
{
    /**
     * POST /api/mobile/favoris/club
     * Toggle favorite status for a club.
     */
    public function toggleClub(Request $request): JsonResponse
    {
        $request->validate([
            'id_anonyme' => ['required', 'string'],
            'club_id'    => ['required', 'exists:clubs,id'],
        ]);

        $idAnonyme = $request->input('id_anonyme');
        $clubId    = (int) $request->input('club_id');

        return DB::transaction(function () use ($idAnonyme, $clubId) {
            $mobileUser = MobileUser::firstOrCreate(
                ['id_anonyme' => $idAnonyme],
                ['date_premiere_visite' => now()]
            );

            $club = Club::lockForUpdate()->findOrFail($clubId);

            $favori = FavoriClub::where('mobile_user_id', $mobileUser->id)
                ->where('club_id', $clubId)
                ->first();

            if ($favori) {
                $favori->delete();
                $club->decrement('nb_abonnes');
                $isFavorite = false;
            } else {
                FavoriClub::create([
                    'mobile_user_id' => $mobileUser->id,
                    'club_id'        => $clubId,
                ]);
                $club->increment('nb_abonnes');
                $isFavorite = true;
            }

            // Sync with clubs_favoris JSON column on mobile_users just in case
            $favoritesList = FavoriClub::where('mobile_user_id', $mobileUser->id)->pluck('club_id')->toArray();
            $mobileUser->update(['clubs_favoris' => $favoritesList]);

            return response()->json([
                'success'     => true,
                'is_favorite' => $isFavorite,
                'nb_abonnes'  => $club->fresh()->nb_abonnes,
            ]);
        });
    }

    /**
     * POST /api/mobile/favoris/joueur
     * Toggle favorite status for a player.
     */
    public function toggleJoueur(Request $request): JsonResponse
    {
        $request->validate([
            'id_anonyme' => ['required', 'string'],
            'joueur_id'  => ['required', 'exists:joueurs,id'],
        ]);

        $idAnonyme = $request->input('id_anonyme');
        $joueurId  = (int) $request->input('joueur_id');

        return DB::transaction(function () use ($idAnonyme, $joueurId) {
            $mobileUser = MobileUser::firstOrCreate(
                ['id_anonyme' => $idAnonyme],
                ['date_premiere_visite' => now()]
            );

            $joueur = Joueur::lockForUpdate()->findOrFail($joueurId);

            $favori = FavoriJoueur::where('mobile_user_id', $mobileUser->id)
                ->where('joueur_id', $joueurId)
                ->first();

            if ($favori) {
                $favori->delete();
                $joueur->decrement('nb_abonnes');
                $isFavorite = false;
            } else {
                FavoriJoueur::create([
                    'mobile_user_id' => $mobileUser->id,
                    'joueur_id'      => $joueurId,
                ]);
                $joueur->increment('nb_abonnes');
                $isFavorite = true;
            }

            return response()->json([
                'success'     => true,
                'is_favorite' => $isFavorite,
                'nb_abonnes'  => $joueur->fresh()->nb_abonnes,
            ]);
        });
    }
}

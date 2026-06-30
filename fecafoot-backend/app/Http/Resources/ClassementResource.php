<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'club_id'         => $this->club_id,
            'club'            => [
                'id'       => $this->club_id,
                'nom'      => $this->club->nom ?? 'Inconnu',
                'logo_url' => $this->club->logo_url ?? null,
                'ville'    => $this->club->ville ?? null,
            ],
            'club_nom'        => $this->club->nom ?? 'Inconnu',
            'club_logo'       => $this->club->logo_url ?? null,
            'club_ville'      => $this->club->ville ?? null,
            'poule_id'        => $this->poule_id,
            'saison_id'       => $this->saison_id,
            'points'          => $this->points,
            'points_reels'    => max(0, $this->points - $this->points_penalite),
            'victoires'       => $this->victoires,
            'nuls'            => $this->nuls,
            'defaites'        => $this->defaites,
            'buts_pour'       => $this->buts_pour,
            'buts_contre'     => $this->buts_contre,
            'diff_buts'       => $this->diff_buts,
            'nb_matchs'       => $this->nb_matchs,
            'cartons_jaunes'  => $this->cartons_jaunes,
            'cartons_rouges'  => $this->cartons_rouges,
            'points_penalite' => $this->points_penalite,
            'motif_penalite'  => $this->motif_penalite,
            'position'        => $this->position,
        ];
    }
}

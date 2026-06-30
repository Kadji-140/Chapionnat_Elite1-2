<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PouleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'phase_id'   => $this->phase_id,
            'nom'        => $this->nom,
            'nb_equipes' => $this->nb_equipes,
            'clubs'      => $this->whenLoaded('clubs', function () {
                return $this->clubs->map(fn($club) => [
                    'id'       => $club->id,
                    'nom'      => $club->nom,
                    'ville'    => $club->ville,
                    'logo_url' => $club->logo_url,
                    'division' => $club->division,
                    'ordre_tirage' => $club->pivot->ordre_tirage,
                ]);
            }),
            'nb_clubs_affectes' => $this->whenLoaded('clubs', fn() => $this->clubs->count()),
        ];
    }
}

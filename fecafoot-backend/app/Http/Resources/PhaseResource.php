<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PhaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'competition_id' => $this->competition_id,
            'nom'            => $this->nom,
            'type'           => $this->type,
            'type_label'     => match($this->type) {
                'reguliere'    => 'Phase régulière',
                'playoff_up'   => 'Playoffs montée',
                'playoff_down' => 'Playoffs maintien',
                'barrage'      => 'Barrage',
                default        => $this->type,
            },
            'ordre'          => $this->ordre,
            'date_debut'     => $this->date_debut?->format('Y-m-d'),
            'date_fin'       => $this->date_fin?->format('Y-m-d'),
            'statut'         => $this->statut,
            'est_terminee'   => (bool) $this->est_terminee,
            'poules'         => $this->whenLoaded('poules', fn() => PouleResource::collection($this->poules)),
            'nb_poules'      => $this->whenLoaded('poules', fn() => $this->poules->count()),
        ];
    }
}

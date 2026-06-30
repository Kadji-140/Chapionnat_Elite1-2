<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompetitionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'saison_id'    => $this->saison_id,
            'niveau'       => $this->niveau,
            'niveau_label' => $this->niveau === 'elite_one' ? 'MTN Elite One' : 'Elite Two',
            'nom'          => $this->nom,
            'statut'       => $this->statut,
            'statut_label' => match($this->statut) {
                'planifiee' => 'Planifiée',
                'en_cours'  => 'En cours',
                'terminee'  => 'Terminée',
                default     => $this->statut,
            },
            'regles'       => $this->whenLoaded('regles', fn() => new ReglesCompetitionResource($this->regles)),
            'phases'       => $this->whenLoaded('phases', fn() => PhaseResource::collection($this->phases)),
            'nb_phases'    => $this->whenLoaded('phases', fn() => $this->phases->count()),
        ];
    }
}

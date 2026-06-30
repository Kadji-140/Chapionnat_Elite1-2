<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaisonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $competitions = $this->whenLoaded('competitions', function () {
            return CompetitionResource::collection($this->competitions);
        });

        return [
            'id'               => $this->id,
            'intitule'         => $this->intitule,
            'date_debut'       => $this->date_debut?->format('Y-m-d'),
            'date_fin'         => $this->date_fin?->format('Y-m-d'),
            'statut'           => $this->statut,
            'statut_label'     => match($this->statut) {
                'planifiee' => 'Planifiée',
                'en_cours'  => 'En cours',
                'terminee'  => 'Terminée',
                default     => $this->statut,
            },
            'clonee_depuis_id' => $this->clonee_depuis_id,
            'nb_competitions'  => $this->whenLoaded('competitions', fn() => $this->competitions->count()),
            'competitions'     => $competitions,
            'created_at'       => $this->created_at?->format('Y-m-d'),
        ];
    }
}

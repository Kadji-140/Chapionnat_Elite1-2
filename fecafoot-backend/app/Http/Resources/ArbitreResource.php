<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource pour l'arbitre.
 * Utilisée par GET /api/admin/arbitres
 */
class ArbitreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'nom'           => $this->nom,
            'prenom'        => $this->prenom,
            'nom_complet'   => "{$this->prenom} {$this->nom}",
            'num_licence'   => $this->num_licence,
            'specification' => $this->specification,
            'specification_label' => match($this->specification) {
                'central'    => 'Arbitre Central',
                'assistant'  => 'Arbitre Assistant',
                'quatrieme'  => 'Quatrième Arbitre',
                default      => $this->specification,
            },
            'region'        => $this->region,
            'villes'        => $this->villes,
            'disponible'    => $this->disponible,
            'actif'         => $this->actif,
            'nb_matchs'     => $this->when(isset($this->matchs_count), $this->matchs_count ?? 0),
            'created_at'    => $this->created_at?->toISOString(),
        ];
    }
}

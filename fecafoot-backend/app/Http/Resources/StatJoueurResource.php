<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StatJoueurResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'joueur_id'           => $this->joueur_id,
            'joueur_nom'          => $this->joueur->nom ?? 'Inconnu',
            'joueur_prenom'       => $this->joueur->prenom ?? '',
            'joueur_poste'        => $this->joueur->poste ?? null,
            'joueur_numero'       => $this->joueur->numero_maillot ?? $this->joueur->num_maillot ?? null,
            'joueur_photo'        => $this->joueur->photo_url ?? null,
            'club_nom'            => $this->joueur->club->nom ?? 'Sans club',
            'club_logo'           => $this->joueur->club->logo_url ?? null,
            'competition_id'      => $this->competition_id,
            'buts'                => $this->buts,
            'passes_decisives'    => $this->passes_decisives,
            'cartons_jaunes'      => $this->cartons_jaunes,
            'cartons_rouges'      => $this->cartons_rouges,
            'minutes_jouees'      => $this->minutes_jouees,
            'nb_matchs'           => $this->nb_matchs,
        ];
    }
}

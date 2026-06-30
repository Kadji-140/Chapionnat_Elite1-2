<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContestationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'match_event_id'    => $this->match_event_id,
            'coach_id'          => $this->coach_id,
            'motif'             => $this->motif,
            'statut'            => $this->statut,
            'decision'          => $this->decision,
            'date_contestation' => $this->date_contestation?->toISOString(),
            'date_decision'     => $this->date_decision?->toISOString(),
            'created_at'        => $this->created_at?->toISOString(),

            // Le coach auteur
            'coach' => $this->whenLoaded('coach', fn() => [
                'id'     => $this->coach->id,
                'nom'    => $this->coach->nom,
                'prenom' => $this->coach->prenom,
                'club'   => [
                    'id'  => $this->coach->club?->id,
                    'nom' => $this->coach->club?->nom,
                ]
            ]),

            // L'événement contesté
            'match_event' => $this->whenLoaded('matchEvent', fn() => [
                'id'                  => $this->matchEvent?->id,
                'match_id'            => $this->matchEvent?->match_id,
                'type'                => $this->matchEvent?->type,
                'minute'              => $this->matchEvent?->minute,
                'minute_additionnelle'=> $this->matchEvent?->minute_additionnelle,
                'description'         => $this->matchEvent?->description,
                'joueur' => $this->matchEvent?->joueur ? [
                    'id'     => $this->matchEvent->joueur->id,
                    'nom'    => $this->matchEvent->joueur->nom,
                    'prenom' => $this->matchEvent->joueur->prenom,
                ] : null,
                'match' => $this->matchEvent?->match ? [
                    'id' => $this->matchEvent->match->id,
                    'club_domicile' => [
                        'id'  => $this->matchEvent->match->clubDomicile?->id,
                        'nom' => $this->matchEvent->match->clubDomicile?->nom,
                    ],
                    'club_exterieur' => [
                        'id'  => $this->matchEvent->match->clubExterieur?->id,
                        'nom' => $this->matchEvent->match->clubExterieur?->nom,
                    ],
                ] : null
            ]),

            // Traitée par
            'traitee_par' => $this->whenLoaded('traiteePar', fn() => [
                'id'     => $this->traiteePar?->id,
                'nom'    => $this->traiteePar?->nom,
                'prenom' => $this->traiteePar?->prenom,
            ]),
        ];
    }
}

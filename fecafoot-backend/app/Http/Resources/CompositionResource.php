<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CompositionResource extends JsonResource
{
    public function toArray($request): array
    {
        $joueurs = $this->whenLoaded('joueurs', fn() =>
            $this->joueurs->map(fn($cj) => [
                'id'            => $cj->id,
                'joueur_id'     => $cj->joueur_id,
                'joueur'        => $cj->relationLoaded('joueur') && $cj->joueur ? [
                    'id'          => $cj->joueur->id,
                    'nom'         => $cj->joueur->nom,
                    'prenom'      => $cj->joueur->prenom,
                    'num_maillot' => $cj->joueur->num_maillot ?? null,
                    'numero_maillot' => $cj->joueur->num_maillot ?? null,
                    'poste'       => $cj->joueur->poste ?? null,
                    'photo_url'   => $cj->joueur->photo_url ?? null,
                ] : null,
                'role'          => $cj->role,           // titulaire | remplacant
                'est_capitaine' => $cj->est_capitaine,
                'minute_entree' => $cj->minute_entree,
                'minute_sortie' => $cj->minute_sortie,
                'poste_id'      => $cj->poste_id,
                'poste_index'   => $cj->poste_index,
            ])
        );

        $titulaires   = collect($joueurs instanceof \Illuminate\Support\Collection ? $joueurs : ($joueurs ?? []))->filter(fn($j) => $j['role'] === 'titulaire')->values();
        $remplacants  = collect($joueurs instanceof \Illuminate\Support\Collection ? $joueurs : ($joueurs ?? []))->filter(fn($j) => $j['role'] === 'remplacant')->values();

        return [
            'id'                => $this->id,
            'match_id'          => $this->match_id,
            'club_id'           => $this->club_id,
            'formation'         => $this->formation,
            'statut'            => $this->statut,
            'est_confirmee'     => $this->est_confirmee,
            'date_confirmation' => $this->date_confirmation?->toIso8601String(),
            'titulaires'        => $titulaires,
            'remplacants'       => $remplacants,
            'nb_titulaires'     => $titulaires->count(),
            'nb_remplacants'    => $remplacants->count(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'match_id'            => $this->match_id,
            'type'                => $this->type,
            'minute'              => $this->minute,
            'minute_additionnelle'=> $this->minute_additionnelle,
            'timestamp_event'     => $this->timestamp_event?->toISOString(),
            'description'         => $this->description,
            'statut'              => $this->statut,
            'created_at'          => $this->created_at?->toISOString(),

            // Club concerné
            'club_id' => $this->club_id,
            'club'    => $this->whenLoaded('club', fn() => [
                'id'  => $this->club->id,
                'nom' => $this->club->nom,
            ]),

            // Joueur principal
            'joueur_id' => $this->joueur_id,
            'joueur'    => $this->whenLoaded('joueur', fn() => [
                'id'          => $this->joueur->id,
                'nom'         => $this->joueur->nom,
                'prenom'      => $this->joueur->prenom,
                'nom_complet' => "{$this->joueur->prenom} {$this->joueur->nom}",
                'num_maillot' => $this->joueur->num_maillot,
            ]),

            // Joueur remplaçant (pour les remplacements)
            'joueur_remplacant_id' => $this->joueur_remplacant_id,
            'joueur_remplacant'    => $this->whenLoaded('joueurRemplacant', fn() => [
                'id'          => $this->joueurRemplacant->id,
                'nom'         => $this->joueurRemplacant->nom,
                'prenom'      => $this->joueurRemplacant->prenom,
                'nom_complet' => "{$this->joueurRemplacant->prenom} {$this->joueurRemplacant->nom}",
                'num_maillot' => $this->joueurRemplacant->num_maillot,
            ]),

            // Saisi par
            'saisi_par' => $this->whenLoaded('saisiPar', fn() => [
                'id'   => $this->saisiPar->id,
                'name' => $this->saisiPar->name,
                'role' => $this->saisiPar->role,
            ]),

            // Contestation rattachée
            'contestation' => $this->whenLoaded('contestation', fn() => [
                'id'                => $this->contestation->id,
                'motif'             => $this->contestation->motif,
                'statut'            => $this->contestation->statut,
                'decision'          => $this->contestation->decision,
                'date_contestation' => $this->contestation->date_contestation?->toISOString(),
            ]),
        ];
    }
}

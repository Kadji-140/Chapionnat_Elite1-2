<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource pour la liste des clubs (vue compacte).
 * Utilisée par GET /api/admin/clubs
 */
class ClubResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'nom'               => $this->nom,
            'ville'             => $this->ville,
            'division'          => $this->division,
            'division_label'    => $this->division === 'elite_one' ? 'Elite One' : 'Elite Two',
            'logo_url'          => $this->logo_url ? asset('storage/' . $this->logo_url) : null,
            'est_actif'         => $this->est_actif,
            'profile_completed' => $this->profile_completed,
            'stade'             => $this->stade,
            'president'         => $this->president,
            'couleurs'          => $this->couleurs,
            'annee_creation'    => $this->annee_creation,
            'telephone'         => $this->telephone,
            'site_web'          => $this->site_web,
            'presentation'      => $this->presentation,
            'created_at'        => $this->created_at?->toISOString(),
            'is_deleted'        => $this->trashed(),

            // Responsable (relation chargée via with('responsable'))
            'responsable' => $this->when($this->relationLoaded('responsable') && $this->responsable, [
                'id'                 => $this->responsable?->id,
                'nom'                => $this->responsable?->nom,
                'prenom'             => $this->responsable?->prenom,
                'email'              => $this->responsable?->email,
                'premiere_connexion' => $this->responsable?->premiere_connexion,
            ]),

            // Compteurs (ajoutés via withCount dans le contrôleur)
            'nb_joueurs'        => $this->when(isset($this->nb_joueurs), $this->nb_joueurs ?? 0),
            'nb_joueurs_valides'=> $this->when(isset($this->nb_joueurs_valides), $this->nb_joueurs_valides ?? 0),
            'nb_coachs'         => $this->when(isset($this->nb_coachs), $this->nb_coachs ?? 0),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource pour un joueur.
 * Utilisée par les endpoints responsable et admin.
 */
class JoueurResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'nom'              => $this->nom,
            'prenom'           => $this->prenom,
            'nom_complet'      => "{$this->prenom} {$this->nom}",
            'date_naissance'   => $this->date_naissance?->toDateString(),
            'age'              => $this->date_naissance ? $this->date_naissance->age : null,
            'nationalite'      => $this->nationalite,
            'num_licence'      => $this->num_licence,
            'poste'            => $this->poste,
            'poste_label'      => $this->getPosteLabel(),
            'num_maillot'      => $this->num_maillot,
            'photo_url'        => $this->photo_url ? asset('storage/' . $this->photo_url) : null,
            'taille_cm'        => $this->taille_cm,
            'poids_kg'         => $this->poids_kg,
            'statut'           => $this->statut,
            'statut_validation'=> $this->statut_validation,
            'est_soumis'       => $this->est_soumis,
            'motif_rejet'      => $this->motif_rejet,
            'created_at'       => $this->created_at?->toISOString(),
            'talent_score'     => $this->talentScores()->orderBy('id', 'desc')->first()?->score_global,

            // Club (chargé si relation disponible)
            'club' => $this->when($this->relationLoaded('club') && $this->club, [
                'id'  => $this->club?->id,
                'nom' => $this->club?->nom,
            ]),
        ];
    }

    /**
     * Traduit le poste technique en libellé lisible.
     */
    private function getPosteLabel(): string
    {
        return match($this->poste) {
            'gardien'          => 'Gardien de but',
            'defenseur_central'=> 'Défenseur central',
            'lateral_droit'    => 'Latéral droit',
            'lateral_gauche'   => 'Latéral gauche',
            'milieu_defensif'  => 'Milieu défensif',
            'milieu_central'   => 'Milieu central',
            'milieu_offensif'  => 'Milieu offensif',
            'ailier_droit'     => 'Ailier droit',
            'ailier_gauche'    => 'Ailier gauche',
            'attaquant_centre' => 'Attaquant de pointe',
            'avant_centre'     => 'Avant-centre',
            default            => $this->poste,
        };
    }
}

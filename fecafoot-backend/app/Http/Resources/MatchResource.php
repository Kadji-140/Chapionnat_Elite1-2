<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MatchResource extends JsonResource
{
    public function toArray($request): array
    {
        $statutLabels = [
            'programme' => 'Programmé',
            'en_cours'  => 'En cours',
            'mi_temps'  => 'Mi-temps',
            'termine'   => 'Terminé',
            'homologue' => 'Homologué',
            'reporte'   => 'Reporté',
            'annule'    => 'Annulé',
            'litige'    => 'En litige',
        ];

        return [
            'id'               => $this->id,
            'competition_id'   => $this->competition_id,
            'phase_id'         => $this->phase_id,
            'poule_id'         => $this->poule_id,
            'journee'          => $this->journee,
            'type'             => $this->type,

            // Clubs
            'club_domicile'  => $this->whenLoaded('clubDomicile', fn() => [
                'id'       => $this->clubDomicile->id,
                'nom'      => $this->clubDomicile->nom,
                'ville'    => $this->clubDomicile->ville,
                'logo_url' => $this->clubDomicile->logo_url,
                'stade'    => $this->clubDomicile->stade,
            ]),
            'club_exterieur' => $this->whenLoaded('clubExterieur', fn() => [
                'id'       => $this->clubExterieur->id,
                'nom'      => $this->clubExterieur->nom,
                'ville'    => $this->clubExterieur->ville,
                'logo_url' => $this->clubExterieur->logo_url,
            ]),

            // Officiels
            'commissaire' => $this->whenLoaded('commissaire', fn() => $this->commissaire ? [
                'id'     => $this->commissaire->id,
                'nom'    => $this->commissaire->nom . ' ' . $this->commissaire->prenom,
                'email'  => $this->commissaire->email,
            ] : null),
            'arbitre_principal' => $this->whenLoaded('arbitrePrincipal', fn() => $this->arbitrePrincipal ? [
                'id'            => $this->arbitrePrincipal->id,
                'nom'           => $this->arbitrePrincipal->nom . ' ' . $this->arbitrePrincipal->prenom,
                'num_licence'   => $this->arbitrePrincipal->num_licence,
                'specification' => $this->arbitrePrincipal->specification,
            ] : null),
            'arbitre_assistant_1' => $this->whenLoaded('arbitreAssistant1', fn() => $this->arbitreAssistant1 ? [
                'id'            => $this->arbitreAssistant1->id,
                'nom'           => $this->arbitreAssistant1->nom . ' ' . $this->arbitreAssistant1->prenom,
                'num_licence'   => $this->arbitreAssistant1->num_licence,
                'specification' => $this->arbitreAssistant1->specification,
            ] : null),
            'arbitre_assistant_2' => $this->whenLoaded('arbitreAssistant2', fn() => $this->arbitreAssistant2 ? [
                'id'            => $this->arbitreAssistant2->id,
                'nom'           => $this->arbitreAssistant2->nom . ' ' . $this->arbitreAssistant2->prenom,
                'num_licence'   => $this->arbitreAssistant2->num_licence,
                'specification' => $this->arbitreAssistant2->specification,
            ] : null),
            'quatrieme_arbitre' => $this->whenLoaded('quatriemeArbitre', fn() => $this->quatriemeArbitre ? [
                'id'            => $this->quatriemeArbitre->id,
                'nom'           => $this->quatriemeArbitre->nom . ' ' . $this->quatriemeArbitre->prenom,
                'num_licence'   => $this->quatriemeArbitre->num_licence,
                'specification' => $this->quatriemeArbitre->specification,
            ] : null),

            // Planning
            'date_heure'    => $this->date_heure?->toIso8601String(),
            'date_heure_fr' => $this->date_heure?->locale('fr')->isoFormat('dddd D MMMM YYYY à HH:mm'),
            'stade'         => $this->stade,
            'terrain_neutre'=> $this->terrain_neutre,

            // Scores
            'score_domicile'  => $this->score_domicile_terrain,
            'score_exterieur' => $this->score_exterieur_terrain,
            'score_officiel_dom' => $this->score_domicile_officiel,
            'score_officiel_ext' => $this->score_exterieur_officiel,
            'score_domicile_prolongation' => $this->score_domicile_prolongation,
            'score_exterieur_prolongation' => $this->score_exterieur_prolongation,
            'score_domicile_tab' => $this->score_domicile_tab,
            'score_exterieur_tab' => $this->score_exterieur_tab,

            // Statut
            'statut'       => $this->statut,
            'statut_label' => $statutLabels[$this->statut] ?? $this->statut,
            'est_homologue'=> $this->est_homologue,
            'elapsed_seconds' => $this->elapsed_seconds,
            'server_time'  => now()->toIso8601String(),
            
            // Périodes et temps additionnel
            'periode' => $this->periode ?? '1ere_mi_temps',
            'temps_additionnel_1er' => $this->temps_additionnel_1er ?? 0,
            'temps_additionnel_2e' => $this->temps_additionnel_2e ?? 0,
            'temps_additionnel_prolongation_1' => $this->temps_additionnel_prolongation_1 ?? 0,
            'temps_additionnel_prolongation_2' => $this->temps_additionnel_prolongation_2 ?? 0,
            'duree_prolongation' => $this->duree_prolongation ?? 15,

            // Report/Annulation
            'motif_report'      => $this->motif_report,
            'date_heure_report' => $this->date_heure_report?->toIso8601String(),

            // Officiels présents ?
            'a_commissaire' => !is_null($this->commissaire_id),
            'a_arbitre'     => !is_null($this->arbitre_principal_id),
            'a_arbitre_assistant_1' => !is_null($this->arbitre_assistant_1_id),
            'a_arbitre_assistant_2' => !is_null($this->arbitre_assistant_2_id),
            'a_quatrieme_arbitre'   => !is_null($this->quatrieme_arbitre_id),
            'events'                => $this->whenLoaded('events', fn() => MatchEventResource::collection($this->events)),
            'compositions'          => $this->whenLoaded('compositions', fn() => CompositionResource::collection($this->compositions)),
            'rapport_soumis'        => $this->relationLoaded('feuille') ? ($this->feuille?->statut === 'soumise') : ($this->feuille()->where('statut', 'soumise')->exists()),
            'chemin_pdf'            => $this->feuille?->chemin_pdf,
            'incidents_rapport'     => $this->feuille?->incidents_rapport,
            'est_manque'            => $this->est_manque,
        ];

    }
}

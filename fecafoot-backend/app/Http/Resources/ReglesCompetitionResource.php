<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReglesCompetitionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'competition_id'           => $this->competition_id,
            'nb_clubs'                 => $this->nb_clubs,
            'format'                   => $this->format,
            'nb_poules'                => $this->nb_poules,
            'nb_matchs_par_club'       => $this->nb_matchs_par_club,
            'a_playoffs'               => (bool) $this->a_playoffs,
            'nb_clubs_playoffs_up'     => $this->nb_clubs_playoffs_up,
            'nb_clubs_playoffs_down'   => $this->nb_clubs_playoffs_down,
            'points_reportes_playoffs' => (bool) $this->points_reportes_playoffs,
            'a_barrage'                => (bool) $this->a_barrage,
            'nb_clubs_barrage'         => $this->nb_clubs_barrage,
            'nb_promus_directs'        => $this->nb_promus_directs,
            'nb_relegues_directs'      => $this->nb_relegues_directs,
            'criteres_egalite'         => $this->criteres_egalite ?? ['points', 'diff_buts', 'buts_pour'],
            'points_victoire'          => $this->points_victoire,
            'points_nul'               => $this->points_nul,
            'points_defaite'           => $this->points_defaite,
            'score_forfait_vainqueur'  => $this->score_forfait_vainqueur,
            'score_forfait_perdant'    => $this->score_forfait_perdant,
            'points_penalite_forfait'  => $this->points_penalite_forfait,
        ];
    }
}

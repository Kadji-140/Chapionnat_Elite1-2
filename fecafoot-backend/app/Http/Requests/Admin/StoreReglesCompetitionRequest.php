<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreReglesCompetitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'nb_clubs'                 => ['required', 'integer', 'min:2', 'max:32'],
            'format'                   => ['required', 'in:poule_unique,poules_multiples'],
            'nb_poules'                => ['required', 'integer', 'min:1', 'max:8'],
            'a_playoffs'               => ['boolean'],
            'nb_clubs_playoffs_up'     => ['nullable', 'integer', 'min:0'],
            'nb_clubs_playoffs_down'   => ['nullable', 'integer', 'min:0'],
            'points_reportes_playoffs' => ['boolean'],
            'a_barrage'                => ['boolean'],
            'nb_clubs_barrage'         => ['nullable', 'integer', 'min:0'],
            'nb_promus_directs'        => ['integer', 'min:0'],
            'nb_relegues_directs'      => ['integer', 'min:0'],
            'criteres_egalite'         => ['array'],
            'criteres_egalite.*'       => ['string'],
            'points_victoire'          => ['integer', 'min:0'],
            'points_nul'               => ['integer', 'min:0'],
            'points_defaite'           => ['integer', 'min:0'],
            'score_forfait_vainqueur'  => ['integer', 'min:0'],
            'score_forfait_perdant'    => ['integer', 'min:0'],
            'points_penalite_forfait'  => ['integer', 'min:0'],
        ];
    }
}

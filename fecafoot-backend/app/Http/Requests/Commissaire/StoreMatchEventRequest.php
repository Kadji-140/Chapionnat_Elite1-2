<?php

namespace App\Http\Requests\Commissaire;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatchEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Le rôle commissaire est déjà vérifié par le middleware
    }

    public function rules(): array
    {
        return [
            'type' => 'required|string|in:but,but_csc,penalty_marque,penalty_rate,carton_jaune,carton_rouge,carton_jaune_rouge,remplacement,incident,temps_additionnel,tir_cadre,tir_non_cadre,arret,faute,hors_jeu,corner,tab,debut_prolongation,fin_prolongation',
            'minute' => 'required|integer|min:0|max:150',
            'minute_additionnelle' => 'nullable|integer|min:1|max:15',
            'joueur_id' => 'nullable|integer|exists:joueurs,id',
            'joueur_remplacant_id' => 'nullable|integer|exists:joueurs,id',
            'club_id' => 'nullable|integer|exists:clubs,id',
            'description' => 'nullable|string|max:1000',
        ];
    }

}

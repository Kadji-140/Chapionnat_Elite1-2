<?php

namespace App\Http\Requests\Responsable;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validation pour l'ajout/modification d'un joueur par le responsable.
 */
class StoreJoueurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // En cas de mise à jour, on ignore le joueur courant pour num_licence et num_maillot
        $joueurId = $this->route('joueur');
        $clubId   = $this->user()->club_id;

        return [
            'nom'            => ['required', 'string', 'max:100'],
            'prenom'         => ['required', 'string', 'max:100'],
            'date_naissance' => ['required', 'date', 'before:today'],
            'nationalite'    => ['nullable', 'string', 'max:100'],
            'num_licence'    => [
                'required', 'string', 'max:50',
                Rule::unique('joueurs', 'num_licence')->ignore($joueurId)->whereNull('deleted_at'),
            ],
            'poste'          => ['required', 'in:gardien,defenseur_central,lateral_droit,lateral_gauche,milieu_defensif,milieu_central,milieu_offensif,ailier_droit,ailier_gauche,attaquant_centre,avant_centre'],
            'num_maillot'    => [
                'required', 'integer', 'min:1', 'max:99',
                Rule::unique('joueurs')->where(fn ($q) => $q->where('club_id', $clubId)->whereNull('deleted_at'))->ignore($joueurId),
            ],
            'photo'          => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
            'taille_cm'      => ['nullable', 'integer', 'min:140', 'max:220'],
            'poids_kg'       => ['nullable', 'integer', 'min:40', 'max:130'],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required'            => 'Le nom du joueur est obligatoire.',
            'prenom.required'         => 'Le prénom du joueur est obligatoire.',
            'date_naissance.required' => 'La date de naissance est obligatoire.',
            'date_naissance.before'   => 'La date de naissance doit être dans le passé.',
            'num_licence.required'    => 'Le numéro de licence est obligatoire.',
            'num_licence.unique'      => 'Ce numéro de licence est déjà utilisé.',
            'poste.required'          => 'Le poste est obligatoire.',
            'poste.in'                => 'Le poste sélectionné n\'est pas valide.',
            'num_maillot.required'    => 'Le numéro de maillot est obligatoire.',
            'num_maillot.unique'      => 'Ce numéro de maillot est déjà pris dans ce club.',
            'num_maillot.min'         => 'Le numéro de maillot doit être entre 1 et 99.',
            'num_maillot.max'         => 'Le numéro de maillot doit être entre 1 et 99.',
            'photo.image'             => 'La photo doit être une image.',
            'photo.max'               => 'La photo ne doit pas dépasser 3 Mo.',
        ];
    }
}

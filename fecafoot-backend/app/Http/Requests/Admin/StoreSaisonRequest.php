<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaisonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'intitule'   => ['required', 'string', 'max:150', 'unique:saisons,intitule'],
            'date_debut' => ['required', 'date'],
            'date_fin'   => ['required', 'date', 'after:date_debut'],
            'cloner_depuis_id' => ['nullable', 'integer', 'exists:saisons,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'intitule.required'   => 'L\'intitulé de la saison est obligatoire.',
            'intitule.unique'     => 'Une saison avec ce nom existe déjà.',
            'date_debut.required' => 'La date de début est obligatoire.',
            'date_fin.required'   => 'La date de fin est obligatoire.',
            'date_fin.after'      => 'La date de fin doit être postérieure à la date de début.',
        ];
    }
}

<?php

namespace App\Http\Requests\Responsable;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation pour l'ajout d'un coach par le responsable de club.
 */
class StoreCoachRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom'    => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email'  => ['required', 'email', 'unique:users,email'],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required'    => 'Le nom du coach est obligatoire.',
            'prenom.required' => 'Le prénom du coach est obligatoire.',
            'email.required'  => 'L\'email du coach est obligatoire.',
            'email.email'     => 'L\'adresse email n\'est pas valide.',
            'email.unique'    => 'Cet email est déjà utilisé par un autre compte.',
        ];
    }
}

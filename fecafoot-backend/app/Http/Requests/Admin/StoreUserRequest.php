<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation pour la création d'un utilisateur (commissaire, journaliste).
 * Le responsable_club est créé via ClubController.
 */
class StoreUserRequest extends FormRequest
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
            'role'   => ['required', 'in:commissaire,journaliste'],
            'villes' => ['nullable', 'string', 'max:255'],  // Pour les commissaires (leurs zones d'intervention)
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required'    => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'email.required'  => 'L\'email est obligatoire.',
            'email.email'     => 'L\'adresse email n\'est pas valide.',
            'email.unique'    => 'Cet email est déjà utilisé.',
            'role.required'   => 'Le rôle est obligatoire.',
            'role.in'         => 'Le rôle doit être commissaire ou journaliste.',
        ];
    }
}

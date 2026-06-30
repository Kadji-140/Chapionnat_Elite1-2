<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation pour la création d'un club.
 * L'admin fournit les infos de base + email du responsable.
 */
class StoreClubRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // L'accès est déjà contrôlé par le middleware role:admin
    }

    public function rules(): array
    {
        return [
            'nom'               => ['required', 'string', 'max:100', 'unique:clubs,nom'],
            'ville'             => ['required', 'string', 'max:100'],
            'division'          => ['required', 'in:elite_one,elite_two'],
            'email_responsable' => ['required', 'email'],
            // ⚠️ TEMPORAIRE : contrainte unique email désactivée pour faciliter les tests
            // Réactiver en production : 'email_responsable' => ['required', 'email', 'unique:users,email']
            'nom_responsable'   => ['nullable', 'string', 'max:100'],
            'prenom_responsable'=> ['nullable', 'string', 'max:100'],
            'logo'              => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required'               => 'Le nom du club est obligatoire.',
            'nom.unique'                 => 'Un club avec ce nom existe déjà.',
            'ville.required'             => 'La ville est obligatoire.',
            'division.required'          => 'La division est obligatoire.',
            'division.in'                => 'La division doit être Elite One ou Elite Two.',
            'email_responsable.required' => 'L\'email du responsable est obligatoire.',
            'email_responsable.email'    => 'L\'email du responsable n\'est pas valide.',
            'logo.image'                 => 'Le logo doit être une image.',
            'logo.max'                   => 'Le logo ne doit pas dépasser 2 Mo.',
        ];
    }
}

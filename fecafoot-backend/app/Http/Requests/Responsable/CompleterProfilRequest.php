<?php

namespace App\Http\Requests\Responsable;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation pour la complétion du profil du club lors de la première connexion.
 * Ces champs sont OBLIGATOIRES pour valider l'onboarding.
 */
class CompleterProfilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stade'          => ['required', 'string', 'max:150'],
            'president'      => ['required', 'string', 'max:150'],
            'couleurs'       => ['required', 'string', 'max:100'],
            'annee_creation' => ['nullable', 'integer', 'min:1900', 'max:' . date('Y')],
            'logo'           => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
        ];
    }

    public function messages(): array
    {
        return [
            'stade.required'     => 'Le nom du stade est obligatoire.',
            'president.required' => 'Le nom du président est obligatoire.',
            'couleurs.required'  => 'Les couleurs officielles sont obligatoires.',
            'logo.image'         => 'Le logo doit être une image.',
            'logo.max'           => 'Le logo ne doit pas dépasser 3 Mo.',
        ];
    }
}

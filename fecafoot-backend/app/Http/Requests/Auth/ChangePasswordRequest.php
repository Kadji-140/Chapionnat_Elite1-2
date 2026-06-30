<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }
 
    public function rules(): array
    {
        return [
            'ancien_password'          => ['required', 'string'],
            'nouveau_password'         => [
                'required',
                'string',
                'min:8',
                'confirmed',                    // Vérifie nouveau_password_confirmation
                'regex:/[A-Z]/',                // Au moins une majuscule
                'regex:/[0-9]/',                // Au moins un chiffre
                'regex:/[@$!%*?&.#_-]/',        // Au moins un caractère spécial
            ],
            'nouveau_password_confirmation' => ['required'],
        ];
    }
 
    public function messages(): array
    {
        return [
            'nouveau_password.min'     => 'Le mot de passe doit contenir au moins 8 caractères.',
            'nouveau_password.regex'   => 'Le mot de passe doit contenir une majuscule, un chiffre et un caractère spécial.',
            'nouveau_password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
        ];
    }
}

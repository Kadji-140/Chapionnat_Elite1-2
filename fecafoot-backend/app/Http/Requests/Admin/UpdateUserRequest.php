<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');
        return [
            'nom'    => ['sometimes', 'string', 'max:100'],
            'prenom' => ['sometimes', 'string', 'max:100'],
            'email'  => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'role'   => ['sometimes', 'in:commissaire,journaliste'],
            'villes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email'   => 'L\'adresse email n\'est pas valide.',
            'email.unique'  => 'Cet email est déjà utilisé.',
            'role.in'       => 'Le rôle doit être commissaire ou journaliste.',
        ];
    }
}

<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation pour la création d'un arbitre.
 */
class StoreArbitreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom'           => ['required', 'string', 'max:100'],
            'prenom'        => ['required', 'string', 'max:100'],
            'num_licence'   => ['required', 'string', 'max:50', 'unique:arbitres,num_licence'],
            'specification' => ['required', 'in:central,assistant,quatrieme'],
            'region'        => ['nullable', 'string', 'max:100'],
            'villes'        => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required'           => 'Le nom est obligatoire.',
            'prenom.required'        => 'Le prénom est obligatoire.',
            'num_licence.required'   => 'Le numéro de licence est obligatoire.',
            'num_licence.unique'     => 'Ce numéro de licence est déjà utilisé.',
            'specification.required' => 'La spécification est obligatoire.',
            'specification.in'       => 'La spécification doit être : central, assistant ou quatrième.',
        ];
    }
}

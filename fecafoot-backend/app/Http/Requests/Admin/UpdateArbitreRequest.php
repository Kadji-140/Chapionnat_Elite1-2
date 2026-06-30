<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateArbitreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $arbitreId = $this->route('arbitre');
        return [
            'nom'           => ['sometimes', 'string', 'max:100'],
            'prenom'        => ['sometimes', 'string', 'max:100'],
            'num_licence'   => ['sometimes', 'string', 'max:50', Rule::unique('arbitres', 'num_licence')->ignore($arbitreId)],
            'specification' => ['sometimes', 'in:central,assistant,quatrieme'],
            'region'        => ['nullable', 'string', 'max:100'],
            'villes'        => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'num_licence.unique' => 'Ce numéro de licence est déjà utilisé.',
            'specification.in'   => 'La spécification doit être : central, assistant ou quatrième.',
        ];
    }
}

<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation pour le rejet d'un joueur (motif obligatoire).
 */
class RejeterJoueurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motif' => ['required', 'string', 'min:10', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'motif.required' => 'Le motif de rejet est obligatoire.',
            'motif.min'      => 'Le motif doit comporter au moins 10 caractères.',
            'motif.max'      => 'Le motif ne peut pas dépasser 500 caractères.',
        ];
    }
}

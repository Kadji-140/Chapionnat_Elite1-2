<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompetitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'niveau' => ['required', 'in:elite_one,elite_two'],
            'nom'    => ['required', 'string', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'niveau.required' => 'Le niveau de la compétition est obligatoire.',
            'niveau.in'       => 'Le niveau doit être elite_one ou elite_two.',
            'nom.required'    => 'Le nom de la compétition est obligatoire.',
        ];
    }
}

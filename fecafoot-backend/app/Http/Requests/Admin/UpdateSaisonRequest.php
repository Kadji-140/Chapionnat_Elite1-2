<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSaisonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        $id = $this->route('saison') ?? $this->route('id');
        return [
            'intitule'   => ['sometimes', 'string', 'max:150', Rule::unique('saisons', 'intitule')->ignore($id)],
            'date_debut' => ['sometimes', 'date'],
            'date_fin'   => ['sometimes', 'date', 'after:date_debut'],
        ];
    }
}

<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class TapisVertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'club_vainqueur_id' => 'required|integer|exists:clubs,id',
            'motif' => 'required|string|min:20|max:2000',
        ];
    }
}

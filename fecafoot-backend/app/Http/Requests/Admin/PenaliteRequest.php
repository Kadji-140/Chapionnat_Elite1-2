<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class PenaliteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'saison_id' => 'required|integer|exists:saisons,id',
            'points_retires' => 'required|integer|min:1|max:15',
            'type' => 'required|string|max:100',
            'motif' => 'required|string|min:20|max:2000',
            'match_id' => 'nullable|integer|exists:matchs,id',
        ];
    }
}

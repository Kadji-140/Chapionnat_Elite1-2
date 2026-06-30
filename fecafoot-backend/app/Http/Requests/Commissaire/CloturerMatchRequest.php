<?php

namespace App\Http\Requests\Commissaire;

use Illuminate\Foundation\Http\FormRequest;

class CloturerMatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Middleware handles role check
    }

    public function rules(): array
    {
        return [
            'incidents' => 'nullable|string|max:5000',
        ];
    }
}

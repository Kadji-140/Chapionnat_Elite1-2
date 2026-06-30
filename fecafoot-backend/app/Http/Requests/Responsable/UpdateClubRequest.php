<?php

namespace App\Http\Requests\Responsable;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClubRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stade'          => ['nullable', 'string', 'max:150'],
            'president'      => ['nullable', 'string', 'max:150'],
            'couleurs'       => ['nullable', 'string', 'max:100'],
            'annee_creation' => ['nullable', 'integer', 'min:1900', 'max:' . date('Y')],
            'logo'           => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
            'site_web'       => ['nullable', 'url', 'max:200'],
            'telephone'      => ['nullable', 'string', 'max:20'],
            'presentation'   => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'logo.image'       => 'Le logo doit être une image.',
            'logo.max'         => 'Le logo ne doit pas dépasser 3 Mo.',
            'site_web.url'     => 'L\'URL du site web n\'est pas valide.',
        ];
    }
}

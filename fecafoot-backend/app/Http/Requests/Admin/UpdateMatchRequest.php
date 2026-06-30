<?php
namespace App\Http\Requests\Admin;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMatchRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'date_heure'    => ['nullable', 'date', 'after:now'],
            'stade'         => ['nullable', 'string', 'max:150'],
            'terrain_neutre'=> ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'date_heure.after' => 'La date et heure du match doivent être dans le futur.',
        ];
    }
}

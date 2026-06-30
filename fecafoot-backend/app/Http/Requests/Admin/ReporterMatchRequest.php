<?php
namespace App\Http\Requests\Admin;
use Illuminate\Foundation\Http\FormRequest;

class ReporterMatchRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'motif'            => ['sometimes', 'nullable', 'string', 'min:10', 'max:500'],
            'date_heure_report'=> ['required', 'date', 'after:now'],
        ];
    }

    public function messages(): array
    {
        return [
            'motif.min'                  => 'Le motif doit contenir au moins 10 caractères.',
            'date_heure_report.required' => 'La nouvelle date du match est obligatoire.',
            'date_heure_report.after'    => 'La nouvelle date ne peut pas être dans le passé.',
        ];
    }
}

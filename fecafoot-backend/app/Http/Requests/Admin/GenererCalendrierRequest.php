<?php
namespace App\Http\Requests\Admin;
use Illuminate\Foundation\Http\FormRequest;

class GenererCalendrierRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'date_debut'   => ['nullable', 'date'],
            'heure_defaut' => ['nullable', 'regex:/^\d{2}:\d{2}$/'],
            'jour_semaine' => ['nullable', 'integer', 'min:0', 'max:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'heure_defaut.regex' => "L'heure doit être au format HH:MM (ex: 15:00).",
            'jour_semaine.min'   => 'Jour invalide (0=Dimanche, 6=Samedi).',
            'jour_semaine.max'   => 'Jour invalide (0=Dimanche, 6=Samedi).',
        ];
    }
}

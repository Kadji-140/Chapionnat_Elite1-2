<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validation pour la modification d'un club.
 * Ignore le club courant pour la règle d'unicité du nom.
 */
class UpdateClubRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $clubId = $this->route('club'); // ID du club dans l'URL

        return [
            'nom'               => ['sometimes', 'string', 'max:100', Rule::unique('clubs', 'nom')->ignore($clubId)],
            'ville'             => ['sometimes', 'string', 'max:100'],
            'division'          => ['sometimes', 'in:elite_one,elite_two'],
            'email_responsable' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($this->getResponsableId())],
            'nom_responsable'   => ['sometimes', 'string', 'max:100'],
            'prenom_responsable'=> ['sometimes', 'string', 'max:100'],
            'logo'              => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'stade'             => ['nullable', 'string', 'max:150'],
            'president'         => ['nullable', 'string', 'max:150'],
            'couleurs'          => ['nullable', 'string', 'max:100'],
            'annee_creation'    => ['nullable', 'integer', 'min:1900', 'max:' . date('Y')],
            'site_web'          => ['nullable', 'url', 'max:200'],
            'telephone'         => ['nullable', 'string', 'max:20'],
            'presentation'      => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Récupère l'ID du responsable actuel pour ignorer son email lors de la validation.
     */
    private function getResponsableId(): ?int
    {
        $club = \App\Models\Club::find($this->route('club'));
        return $club?->responsable_id;
    }

    public function messages(): array
    {
        return [
            'nom.unique'               => 'Un club avec ce nom existe déjà.',
            'division.in'              => 'La division doit être Elite One ou Elite Two.',
            'email_responsable.email'  => 'L\'email du responsable n\'est pas valide.',
            'email_responsable.unique' => 'Cet email est déjà utilisé par un autre compte.',
            'logo.image'               => 'Le logo doit être une image.',
            'logo.max'                 => 'Le logo ne doit pas dépasser 2 Mo.',
            'annee_creation.min'       => 'L\'année de création ne peut pas être antérieure à 1900.',
            'annee_creation.max'       => 'L\'année de création ne peut pas être dans le futur.',
            'site_web.url'             => 'L\'URL du site web n\'est pas valide.',
        ];
    }
}

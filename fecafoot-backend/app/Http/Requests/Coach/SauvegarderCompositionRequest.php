<?php
namespace App\Http\Requests\Coach;
use Illuminate\Foundation\Http\FormRequest;

class SauvegarderCompositionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'formation'              => ['required', 'string', 'in:4-3-3,4-4-2,3-5-2,4-2-3-1,5-3-2,4-1-4-1,3-4-3'],
            'joueurs'                => ['required', 'array', 'min:1', 'max:23'],
            'joueurs.*.joueur_id'    => ['required', 'exists:joueurs,id'],
            'joueurs.*.role'         => ['required', 'in:titulaire,remplacant'],
            'joueurs.*.est_capitaine'=> ['nullable', 'boolean'],
            'joueurs.*.minute_entree'=> ['nullable', 'integer', 'min:0', 'max:120'],
            'joueurs.*.minute_sortie'=> ['nullable', 'integer', 'min:0', 'max:120'],
            'joueurs.*.poste_id'     => ['nullable', 'string'],
            'joueurs.*.poste_index'  => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'formation.required'        => 'La formation tactique est obligatoire.',
            'formation.in'              => 'Formation invalide. Choisissez parmi : 4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 5-3-2, 4-1-4-1, 3-4-3.',
            'joueurs.required'          => 'La liste des joueurs est obligatoire.',
            'joueurs.min'               => 'Vous devez sélectionner au moins 1 joueur.',
            'joueurs.*.joueur_id.exists'=> 'Un joueur sélectionné n\'existe pas ou n\'est pas validé.',
        ];
    }
}

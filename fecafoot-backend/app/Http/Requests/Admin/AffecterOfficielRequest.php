<?php
namespace App\Http\Requests\Admin;
use Illuminate\Foundation\Http\FormRequest;

class AffecterOfficielRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'commissaire_id' => ['nullable', 'exists:users,id'],
            'arbitre_id'     => ['nullable', 'exists:arbitres,id'],
            'role'           => ['nullable', 'string', 'in:principal,assistant_1,assistant_2,quatrieme'],
        ];
    }
}

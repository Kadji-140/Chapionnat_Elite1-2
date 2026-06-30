<?php

namespace App\Http\Requests\Coach;

use Illuminate\Foundation\Http\FormRequest;

class StoreContestationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'match_event_id' => 'required|integer|exists:match_events,id',
            'motif' => 'required|string|min:20|max:2000',
        ];
    }
}

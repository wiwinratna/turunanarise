<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ParticipantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // We use Policies in the controller
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        $rules = [
            'name' => 'nullable|string|max:255',
            'jobTitle' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string|max:255',
            'idType' => 'nullable|string|max:255',
            'employeeId' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'function' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:255',
        ];

        if (!$isUpdate) {
            $rules['event_id'] = 'required|string';
            $rules['participant_data'] = 'nullable|array';
        } else {
            $rules['event_id'] = 'nullable|string';
        }

        return $rules;
    }
}

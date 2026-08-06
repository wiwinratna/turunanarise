<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CountryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        if ($isUpdate) {
            return [
                'flag' => 'nullable|string',
                'code' => 'nullable|string',
                'gym_code' => 'nullable|string',
                'name' => 'nullable|string|max:255',
                'active' => 'nullable|boolean',
            ];
        }

        return [
            'id' => 'required|string|unique:countries,id',
            'event_id' => 'nullable|string|exists:events,id',
            'flag' => 'required|string',
            'code' => 'required|string',
            'gym_code' => 'required|string',
            'name' => 'required|string|max:255',
            'active' => 'nullable|boolean',
        ];
    }
}

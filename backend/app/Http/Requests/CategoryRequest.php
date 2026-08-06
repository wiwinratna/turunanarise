<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CategoryRequest extends FormRequest
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
            $catId = $this->route('category') ?: $this->route('id');
            return [
                'code' => 'nullable|string|unique:categories,code,' . $catId,
                'name' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'active' => 'nullable|boolean',
            ];
        }

        return [
            'id' => 'required|string|unique:categories,id',
            'event_id' => 'required|string|exists:events,id',
            'code' => 'required|string|unique:categories,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'active' => 'nullable|boolean',
        ];
    }
}

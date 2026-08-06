<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CardRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $uri = $this->route()->uri();
        
        if (str_contains($uri, 'update-layout')) {
            return [
                'elements' => 'required|array',
                'card_orientation' => 'nullable|string',
                'background_color' => 'nullable|string',
            ];
        }
        
        if (str_contains($uri, 'update-status')) {
            return [
                'status' => 'required|string|in:draft,completed,updated,error',
            ];
        }

        if (str_contains($uri, 'whatsapp')) {
            return [
                'phone' => 'required|string',
            ];
        }

        if ($this->isMethod('post')) {
            return [
                'participant_id' => 'required|string',
                'event_id' => 'required|string',
                'card_orientation' => 'nullable|string',
                'background_color' => 'nullable|string',
            ];
        }

        return [
            'card_orientation' => 'nullable|string',
            'background_color' => 'nullable|string',
            'status' => 'nullable|string|in:draft,completed,updated,error',
            'thumbnail_path' => 'nullable|string',
        ];
    }
}

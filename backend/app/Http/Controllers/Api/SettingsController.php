<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;

class SettingsController extends Controller
{
    public function getBranding()
    {
        $setting = Setting::where('key', 'login_branding')->first();
        return response()->json([
            'branding' => $setting ? $setting->value : null
        ]);
    }

    public function updateBranding(Request $request)
    {
        // Only superadmin
        if ($request->user()->role->value !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'layout' => 'nullable|string',
            'title' => 'nullable|string',
            'subtitle' => 'nullable|string',
            'primaryColor' => 'nullable|string',
            'backgroundColor' => 'nullable|string',
            'panelColor' => 'nullable|string',
            'backgroundImage' => 'nullable|string',
            'logoUrl' => 'nullable|string',
            'logoText' => 'nullable|string',
        ]);

        $setting = Setting::firstOrCreate(
            ['key' => 'login_branding'],
            ['value' => []]
        );

        $currentValue = $setting->value ?? [];
        $newValue = array_merge($currentValue, $validated);

        $setting->value = $newValue;
        $setting->save();

        return response()->json([
            'message' => 'Branding settings updated successfully',
            'branding' => $setting->value
        ]);
    }
}

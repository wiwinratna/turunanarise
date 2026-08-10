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
        try {
            // Only superadmin
            $role = $request->user()->role;
            $roleValue = $role instanceof \BackedEnum ? $role->value : $role;
            if ($roleValue !== 'superadmin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validated = $request->validate([
                'layout' => 'nullable|string',
                'title' => 'nullable|string',
                'subtitle' => 'nullable|string',
                'primaryColor' => 'nullable|string',
                'backgroundColor' => 'nullable|string',
                'panelColor' => 'nullable|string',
                'textColor' => 'nullable|string',
                'backgroundImage' => 'nullable|string',
                'logoUrl' => 'nullable|string',
                'logoText' => 'nullable|string',
            ]);

            $setting = Setting::firstOrCreate(
                ['key' => 'login_branding'],
                ['value' => []]
            );

            $currentValue = is_array($setting->value) ? $setting->value : (json_decode($setting->value, true) ?: []);
            if (!is_array($currentValue)) {
                $currentValue = [];
            }
            $newValue = array_merge($currentValue, $validated);

            $setting->value = $newValue;
            $setting->save();

            return response()->json([
                'message' => 'Branding settings updated successfully',
                'branding' => $setting->value
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Debug Error: ' . $e->getMessage() . ' on line ' . $e->getLine()
            ], 500);
        }
    }

    public function uploadImage(Request $request)
    {
        // Only superadmin
        $role = $request->user()->role;
        $roleValue = $role instanceof \BackedEnum ? $role->value : $role;
        if ($roleValue !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:jpeg,png,jpg,gif,svg,webp,mp4,webm|max:20480', // Allow up to 20MB for videos
        ]);

        $file = $request->file('file');
        
        // Use time to make filename unique
        $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file->getClientOriginalName());
        
        // Store directly in public/branding so it's web-accessible without storage:link
        $brandingDir = public_path('branding');
        if (!is_dir($brandingDir)) {
            mkdir($brandingDir, 0755, true);
        }
        $moved = $file->move($brandingDir, $filename);
        
        // Build the URL using the incoming request's domain
        $baseUrl = $request->getSchemeAndHttpHost();
        $url = $baseUrl . '/api/branding/' . $filename;
        
        return response()->json([
            'url' => $url,
            'debug_public_path' => $brandingDir,
            'debug_file_exists' => file_exists($brandingDir . '/' . $filename),
        ]);
    }
}

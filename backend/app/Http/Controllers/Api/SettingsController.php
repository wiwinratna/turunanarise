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
            'file' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:4096',
        ]);

        $file = $request->file('file');
        
        // Use time to make filename unique and avoid overwriting instantly
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('public/branding', $filename);
        
        // Format the URL as /api/storage/branding/filename so the existing route can serve it
        $url = url('/api/storage/branding/' . $filename);
        
        return response()->json(['url' => $url]);
    }
}

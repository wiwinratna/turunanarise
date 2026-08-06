<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Http\Requests\CountryRequest;
use Illuminate\Http\Request;

class CountryController extends Controller
{
    public function index(Request $request)
    {
        if ($request->has('event_id')) {
            $eventId = $request->query('event_id');
            if ($eventId === 'null' || $eventId === '') {
                $countries = Country::whereNull('event_id')->get();
            } else {
                $countries = Country::where('event_id', $eventId)->get();
            }
        } else {
            $countries = Country::all();
        }
        return response()->json($countries);
    }

    public function store(CountryRequest $request)
    {
        $validated = $request->validated();

        $country = Country::create([
            'id' => $validated['id'],
            'event_id' => $validated['event_id'] ?? null,
            'flag' => $validated['flag'],
            'code' => $validated['code'],
            'gym_code' => $validated['gym_code'],
            'name' => $validated['name'],
            'active' => $validated['active'] ?? true,
        ]);

        return response()->json($country, 201);
    }

    public function update(CountryRequest $request, $id)
    {
        $country = Country::findOrFail($id);

        $validated = $request->validated();

        if (isset($validated['flag'])) $country->flag = $validated['flag'];
        if (isset($validated['code'])) $country->code = $validated['code'];
        if (isset($validated['gym_code'])) $country->gym_code = $validated['gym_code'];
        if (isset($validated['name'])) $country->name = $validated['name'];
        if (isset($validated['active'])) $country->active = $validated['active'];

        $country->save();

        return response()->json($country);
    }

    public function destroy($id)
    {
        $country = Country::findOrFail($id);
        $country->delete();

        return response()->json(['message' => 'Country deleted successfully']);
    }
}

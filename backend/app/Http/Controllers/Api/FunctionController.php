<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterFunction;
use Illuminate\Http\Request;

class FunctionController extends Controller
{
    public function index(Request $request)
    {
        $eventId = $request->query('event_id');
        if ($eventId) {
            $functions = MasterFunction::where('event_id', $eventId)->with('category')->get();
        } else {
            $functions = MasterFunction::with('category')->get();
        }
        return response()->json($functions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|string|unique:functions,id',
            'event_id' => 'required|string|exists:events,id',
            'code' => 'required|string|unique:functions,code',
            'name' => 'required|string|max:255',
            'category_id' => 'required|string|exists:categories,id',
            'description' => 'nullable|string',
            'active' => 'nullable|boolean',
        ]);

        $function = MasterFunction::create([
            'id' => $validated['id'],
            'event_id' => $validated['event_id'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'category_id' => $validated['category_id'],
            'description' => $validated['description'] ?? null,
            'active' => $validated['active'] ?? true,
        ]);

        return response()->json($function, 201);
    }

    public function update(Request $request, $id)
    {
        $function = MasterFunction::findOrFail($id);

        $validated = $request->validate([
            'code' => 'nullable|string|unique:functions,code,' . $function->id,
            'name' => 'nullable|string|max:255',
            'category_id' => 'nullable|string|exists:categories,id',
            'description' => 'nullable|string',
            'active' => 'nullable|boolean',
        ]);

        if (isset($validated['code'])) $function->code = $validated['code'];
        if (isset($validated['name'])) $function->name = $validated['name'];
        if (isset($validated['category_id'])) $function->category_id = $validated['category_id'];
        if (isset($validated['description'])) $function->description = $validated['description'];
        if (isset($validated['active'])) $function->active = $validated['active'];

        $function->save();

        return response()->json($function);
    }

    public function destroy($id)
    {
        $function = MasterFunction::findOrFail($id);
        $function->delete();

        return response()->json(['message' => 'Function deleted successfully']);
    }
}

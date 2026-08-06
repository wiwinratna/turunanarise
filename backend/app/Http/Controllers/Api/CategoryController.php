<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Http\Requests\CategoryRequest;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $eventId = $request->query('event_id');
        if ($eventId) {
            $categories = Category::where('event_id', $eventId)->get();
        } else {
            $categories = Category::all();
        }
        return response()->json($categories);
    }

    public function store(CategoryRequest $request)
    {
        $validated = $request->validated();

        $category = Category::create([
            'id' => $validated['id'],
            'event_id' => $validated['event_id'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'active' => $validated['active'] ?? true,
        ]);

        return response()->json($category, 201);
    }

    public function update(CategoryRequest $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validated();

        if (isset($validated['code'])) $category->code = $validated['code'];
        if (isset($validated['name'])) $category->name = $validated['name'];
        if (isset($validated['description'])) $category->description = $validated['description'];
        if (isset($validated['active'])) $category->active = $validated['active'];

        $category->save();

        return response()->json($category);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}

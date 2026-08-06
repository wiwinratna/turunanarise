<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\User;
use App\Http\Requests\EventRequest;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isSuper = ($user->role === 'superadmin' || $user->role->value === 'superadmin');

        if ($isSuper) {
            $events = Event::withCount('cards')->get();
        } else {
            $eventIds = is_array($user->event_id) ? $user->event_id : ($user->event_id ? [$user->event_id] : []);
            if (empty($eventIds)) {
                return response()->json([]);
            }
            $events = Event::whereIn('id', $eventIds)->withCount('cards')->get();
        }

        return response()->json($events);
    }

    public function checkCode(Request $request)
    {
        $code = $request->query('code');
        if (!$code) {
            return response()->json(['exists' => false]);
        }
        $exists = Event::where('event_code', $code)->exists();
        return response()->json(['exists' => $exists]);
    }

    public function show(Request $request, $id)
    {
        $event = Event::withCount('cards')->findOrFail($id);
        $this->authorize('view', $event);
        return response()->json($event);
    }

    public function store(EventRequest $request)
    {
        $this->authorize('create', Event::class);
        $validated = $request->validated();

        $event = Event::create([
            'event_code' => $validated['event_code'],
            'name' => $validated['name'],
            'date' => $validated['date'],
            'location' => $validated['location'],
            'country_id' => $validated['country_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'active' => $validated['active'] ?? true,
        ]);

        return response()->json($event, 201);
    }

    public function update(EventRequest $request, $id)
    {
        $event = Event::findOrFail($id);
        $this->authorize('update', $event);

        $validated = $request->validated();

        $event->update([
            'event_code' => $validated['event_code'],
            'name' => $validated['name'],
            'date' => $validated['date'],
            'location' => $validated['location'],
            'country_id' => $validated['country_id'],
            'description' => $validated['description'] ?? null,
            'active' => $validated['active'] ?? $event->active,
        ]);

        return response()->json($event);
    }

    public function destroy(Request $request, $id)
    {
        $event = Event::findOrFail($id);
        $this->authorize('delete', $event);

        $event->delete();

        return response()->json(['message' => 'Event deleted successfully']);
    }
}

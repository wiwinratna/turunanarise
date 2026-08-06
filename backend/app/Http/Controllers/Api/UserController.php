<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Event;
use App\Http\Requests\UserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $users = User::all();
        $events = Event::all()->keyBy('id');

        $users->each(function ($user) use ($events) {
            $ids = is_array($user->event_id) ? $user->event_id : ($user->event_id ? [$user->event_id] : []);
            $user->assigned_events = collect($ids)->map(function ($id) use ($events) {
                return $events->get($id);
            })->filter()->values();
        });

        return response()->json($users);
    }

    public function store(UserRequest $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validated();

        $eventId = $request->input('event_id');
        if ($validated['role'] === 'superadmin') {
            $eventId = null;
        } else {
            if (is_string($eventId)) {
                $eventId = [$eventId];
            }
            if (is_array($eventId)) {
                $eventId = array_filter($eventId);
                foreach ($eventId as $id) {
                    if (!Event::where('id', $id)->exists()) {
                        return response()->json(['message' => 'The selected event ID is invalid: ' . $id], 422);
                    }
                }
            } else {
                $eventId = null;
            }
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'event_id' => $eventId,
            'avatar' => $validated['avatar'] ?? null,
            'active' => $validated['active'] ?? true,
        ]);

        return response()->json($user, 201);
    }

    public function update(UserRequest $request, $id)
    {
        $user = User::findOrFail($id);
        $this->authorize('update', $user);

        $validated = $request->validated();

        if (isset($validated['name'])) $user->name = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (!empty($validated['password'])) $user->password = Hash::make($validated['password']);
        if (isset($validated['avatar'])) $user->avatar = $validated['avatar'];
        
        $authUser = $request->user();
        $isSuper = ($authUser->role === 'superadmin' || (isset($authUser->role->value) && $authUser->role->value === 'superadmin'));

        if ($isSuper) {
            if (isset($validated['role'])) $user->role = $validated['role'];
            if (isset($validated['active'])) $user->active = $validated['active'];

            if ($request->has('event_id')) {
                $eventId = $request->input('event_id');
                $role = $validated['role'] ?? ($user->role instanceof \App\Enums\UserRole ? $user->role->value : $user->role);
                if ($role === 'superadmin') {
                    $user->event_id = null;
                } else {
                    if (is_string($eventId)) {
                        $eventId = [$eventId];
                    }
                    if (is_array($eventId)) {
                        $eventId = array_filter($eventId);
                        foreach ($eventId as $eId) {
                            if (!Event::where('id', $eId)->exists()) {
                                return response()->json(['message' => 'The selected event ID is invalid: ' . $eId], 422);
                            }
                        }
                        $user->event_id = $eventId;
                    } else {
                        $user->event_id = null;
                    }
                }
            }
        }

        $user->save();

        return response()->json($user);
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $this->authorize('delete', $user);

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}

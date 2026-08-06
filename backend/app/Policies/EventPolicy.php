<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Event;

class EventPolicy
{
    /**
     * Perform pre-authorization checks.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->role === 'superadmin' || (isset($user->role->value) && $user->role->value === 'superadmin')) {
            return true;
        }

        return null; // fall through
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Admins can view events, but index usually filters it down anyway
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Event $event): bool
    {
        $eventIds = is_array($user->event_id) ? $user->event_id : ($user->event_id ? [$user->event_id] : []);
        return in_array($event->id, $eventIds);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false; // Only superadmin
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Event $event): bool
    {
        return false; // Only superadmin
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Event $event): bool
    {
        return false; // Only superadmin
    }
}

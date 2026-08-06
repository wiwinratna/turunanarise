<?php

namespace App\Policies;

use App\Models\User;
use App\Models\EventLayout;

class EventLayoutPolicy
{
    public function before(User $user, string $ability): bool|null
    {
        if ($user->role === 'superadmin' || (isset($user->role->value) && $user->role->value === 'superadmin')) {
            return true;
        }
        return null;
    }

    private function hasEventAccess(User $user, $eventId): bool
    {
        $eventIds = is_array($user->event_id) ? $user->event_id : ($user->event_id ? [$user->event_id] : []);
        return in_array($eventId, $eventIds);
    }

    public function view(User $user, $eventId): bool
    {
        return $this->hasEventAccess($user, $eventId);
    }

    public function update(User $user, $eventId): bool
    {
        return $this->hasEventAccess($user, $eventId);
    }
}

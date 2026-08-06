<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Card;

class CardPolicy
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

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Card $card): bool
    {
        return $this->hasEventAccess($user, $card->event_id);
    }

    public function create(User $user): bool
    {
        return $this->hasEventAccess($user, request()->input('event_id'));
    }

    public function update(User $user, Card $card): bool
    {
        return $this->hasEventAccess($user, $card->event_id);
    }

    public function delete(User $user, Card $card): bool
    {
        return $this->hasEventAccess($user, $card->event_id);
    }
}

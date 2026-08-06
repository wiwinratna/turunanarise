<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Event;
use Illuminate\Support\Str;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_cannot_access_other_admin_event()
    {
        // Setup two events
        $event1 = Event::factory()->create(['id' => Str::uuid(), 'event_code' => 'EVT1', 'name' => 'Event 1']);
        $event2 = Event::factory()->create(['id' => Str::uuid(), 'event_code' => 'EVT2', 'name' => 'Event 2']);

        // Setup admin 1
        $admin1 = User::factory()->create(['role' => 'admin', 'event_id' => [$event1->id]]);

        // Admin 1 tries to access event 2
        $response = $this->actingAs($admin1)->getJson('/api/events/' . $event2->id);

        $response->assertStatus(403);
    }

    public function test_admin_can_access_their_own_event()
    {
        // Setup event
        $event1 = Event::factory()->create(['id' => Str::uuid(), 'event_code' => 'EVT1', 'name' => 'Event 1']);

        // Setup admin 1
        $admin1 = User::factory()->create(['role' => 'admin', 'event_id' => [$event1->id]]);

        // Admin 1 tries to access event 1
        $response = $this->actingAs($admin1)->getJson('/api/events/' . $event1->id);

        $response->assertStatus(200);
    }

    public function test_superadmin_can_access_any_event()
    {
        // Setup event
        $event1 = Event::factory()->create(['id' => Str::uuid(), 'event_code' => 'EVT1', 'name' => 'Event 1']);

        // Setup superadmin
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        // Superadmin tries to access event 1
        $response = $this->actingAs($superadmin)->getJson('/api/events/' . $event1->id);

        $response->assertStatus(200);
    }

    public function test_admin_cannot_escalate_role_to_superadmin()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $response = $this->actingAs($admin)->putJson('/api/users/' . $admin->id, [
            'name' => 'Hacked Name',
            'role' => 'superadmin',
            'email' => $admin->email
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Hacked Name', $admin->fresh()->name);
        $this->assertEquals('admin', $admin->fresh()->role->value); // Role should not change
    }

    public function test_admin_cannot_change_own_event_id()
    {
        $admin = User::factory()->create(['role' => 'admin', 'event_id' => ['EVT1']]);
        $response = $this->actingAs($admin)->putJson('/api/users/' . $admin->id, [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'admin',
            'event_id' => ['EVT2']
        ]);

        $response->assertStatus(200);
        $this->assertEquals(['EVT1'], $admin->fresh()->event_id); // event_id should not change
    }

    public function test_superadmin_can_change_admin_role_and_event_id()
    {
        $superadmin = User::factory()->create(['role' => 'superadmin']);
        $admin = User::factory()->create(['role' => 'admin', 'event_id' => ['EVT1']]);
        
        $event2 = Event::factory()->create(['id' => Str::uuid(), 'event_code' => 'EVT2', 'name' => 'Event 2']);

        $response = $this->actingAs($superadmin)->putJson('/api/users/' . $admin->id, [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'superadmin',
            'event_id' => [$event2->id]
        ]);

        $response->assertStatus(200);
        $this->assertEquals('superadmin', $admin->fresh()->role->value);
        $this->assertEquals(null, $admin->fresh()->event_id); // because role is superadmin, event_id becomes null based on the controller logic
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Event;
use App\Models\Category;
use App\Models\MasterFunction;
use App\Models\Country;
use App\Models\Participant;
use App\Models\Card;
use App\Models\Layout;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Events
        $events = [
            [
                'id' => 'evt-1',
                'event_code' => 'ACS25',
                'name' => 'Annual Corporate Summit 2025',
                'date' => '2025-03-15',
                'location' => 'San Francisco, CA',
                'description' => 'Company-wide annual gathering for all departments',
                'active' => true,
            ],
            [
                'id' => 'evt-2',
                'event_code' => 'Q2LC25',
                'name' => 'Q2 Leadership Conference',
                'date' => '2025-06-20',
                'location' => 'New York, NY',
                'description' => 'Quarterly leadership alignment and strategy session',
                'active' => true,
            ],
            [
                'id' => 'evt-3',
                'event_code' => 'TIE25',
                'name' => 'Tech Innovation Expo',
                'date' => '2025-09-10',
                'location' => 'Austin, TX',
                'description' => 'Technology showcase and networking event',
                'active' => true,
            ],
            [
                'id' => 'evt-4',
                'event_code' => 'HROW25',
                'name' => 'HR Onboarding Week',
                'date' => '2025-01-08',
                'location' => 'Chicago, IL',
                'description' => 'New employee orientation and badge generation',
                'active' => false,
            ]
        ];

        foreach ($events as $event) {
            Event::create($event);
        }

        // 2. Seed Users
        $users = [
            [
                'id' => 'u1',
                'name' => 'Super Admin',
                'email' => 'superadmin@cardforge.io',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'superadmin',
                'event_id' => null,
                'avatar' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format',
                'active' => true,
            ],
            [
                'id' => 'u2',
                'name' => 'Alexandra Chen',
                'email' => 'alex@company.com',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'admin',
                'event_id' => ['evt-1', 'evt-2'],
                'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&auto=format',
                'active' => true,
            ],
            [
                'id' => 'u3',
                'name' => 'Marcus Reed',
                'email' => 'marcus@company.com',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'admin',
                'event_id' => ['evt-2'],
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format',
                'active' => true,
            ],
            [
                'id' => 'u4',
                'name' => 'Sarah Kim',
                'email' => 'sarah@company.com',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'admin',
                'event_id' => ['evt-1'],
                'avatar' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&auto=format',
                'active' => true,
            ],
            [
                'id' => 'u5',
                'name' => 'David Park',
                'email' => 'david@company.com',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'admin',
                'event_id' => ['evt-3'],
                'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&auto=format',
                'active' => false,
            ],
        ];

        foreach ($users as $user) {
            User::create($user);
        }

        // --- MASTER DATA SEEDING DISABLED AS PER REQUEST ---
        // Master data (Categories, Functions, Countries) and Participants 
        // must be inputted manually by the admin.
        
        /*
        // 3. Seed Categories
        $categories = [ ... ];
        foreach ($categories as $cat) { Category::create($cat); }

        // 4. Seed Functions
        $functions = [ ... ];
        foreach ($functions as $fn) { MasterFunction::create($fn); }

        // 5. Seed Countries
        $countries = [ ... ];
        foreach ($countries as $c) { Country::create($c); }

        // 6. Seed Example Participants with Cards & Layouts
        ...
        */
    }
}

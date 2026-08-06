<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Category;
use App\Models\MasterFunction;
use App\Models\Country;
use App\Models\Participant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $events = Event::all();

        foreach ($events as $event) {
            $eventId = $event->id;
            
            // Seed Categories
            $catModels = [];
            $categories = [
                ['id' => uniqid('cat-'), 'event_id' => $eventId, 'code' => 'CAT-01-' . $eventId, 'name' => 'VIP', 'description' => 'Very Important Person', 'active' => true],
                ['id' => uniqid('cat-'), 'event_id' => $eventId, 'code' => 'CAT-02-' . $eventId, 'name' => 'Staff', 'description' => 'Event Staff', 'active' => true],
                ['id' => uniqid('cat-'), 'event_id' => $eventId, 'code' => 'CAT-03-' . $eventId, 'name' => 'Speaker', 'description' => 'Event Speaker', 'active' => true],
            ];
            foreach ($categories as $cat) { 
                $catModels[] = Category::firstOrCreate(['code' => $cat['code']], $cat); 
            }

            // Seed Functions
            $fnModels = [];
            $functions = [
                ['id' => uniqid('fn-'), 'event_id' => $eventId, 'category_id' => $catModels[0]->id, 'code' => 'FN-01-' . $eventId, 'name' => 'Management', 'description' => 'Management Role', 'active' => true],
                ['id' => uniqid('fn-'), 'event_id' => $eventId, 'category_id' => $catModels[1]->id, 'code' => 'FN-02-' . $eventId, 'name' => 'Engineering', 'description' => 'Engineering Role', 'active' => true],
            ];
            foreach ($functions as $fn) { 
                $fnModels[] = MasterFunction::firstOrCreate(['code' => $fn['code']], $fn); 
            }

            // Seed Countries
            $coModels = [];
            $countries = [
                ['id' => uniqid('co-'), 'event_id' => null, 'code' => 'ID', 'name' => 'Indonesia', 'active' => true],
                ['id' => uniqid('co-'), 'event_id' => null, 'code' => 'SG', 'name' => 'Singapore', 'active' => true],
            ];
            foreach ($countries as $c) {
                if (!Country::where('code', $c['code'])->exists()) {
                    $coModels[] = Country::create($c);
                } else {
                    $coModels[] = Country::where('code', $c['code'])->first();
                }
            }

            // Seed Participants
            if (Participant::where('event_id', $eventId)->count() < 10) {
                for ($i = 1; $i <= 10; $i++) {
                    Participant::create([
                        'id' => uniqid('part-'),
                        'event_id' => $eventId,
                        'name' => 'Dummy Participant ' . $i,
                        'job_title' => 'Engineer',
                        'company' => 'Dummy Corp',
                        'email' => 'dummy'.$i.'-'.$eventId.'@example.com',
                        'phone' => '1234567890',
                        'id_type' => 'KTP',
                        'employee_id' => 'EMP-'.$i,
                        'category_id' => $catModels[array_rand($catModels)]->id,
                        'function_id' => $fnModels[array_rand($fnModels)]->id,
                        'nationality' => $coModels[array_rand($coModels)]->id,
                        'custom_fields' => json_encode(['food' => 'Vegetarian']),
                    ]);
                }
            }
            
            echo "Seeded dummy data for event: {$event->name}\n";
        }
    }
}

<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => fake()->uuid(),
            'event_code' => fake()->unique()->slug(),
            'name' => fake()->sentence(3),
            'date' => fake()->date(),
            'location' => fake()->city(),
            'description' => fake()->paragraph(),
            'active' => true,
        ];
    }
}

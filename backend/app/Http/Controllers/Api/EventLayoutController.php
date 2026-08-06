<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventLayout;
use App\Models\Card;
use App\Http\Requests\EventLayoutRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventLayoutController extends Controller
{
    /**
     * GET /events/{eventId}/layout
     * Fetch the saved template layout for an event.
     */
    public function show(Request $request, $eventId)
    {
        $this->authorize('view', [EventLayout::class, $eventId]);

        $layout = EventLayout::where('event_id', $eventId)->first();

        return response()->json([
            'event_id'         => $eventId,
            'has_layout'       => !is_null($layout),
            'elements'         => $layout ? ($layout->elements ?? []) : [],
            'card_orientation' => $layout ? $layout->card_orientation : 'landscape',
            'background_color' => $layout ? $layout->background_color : '#13131e',
        ]);
    }

    /**
     * PUT /events/{eventId}/layout
     * Save (or update) the template layout for an event.
     * Also marks ALL cards in this event as "completed".
     */
    public function update(EventLayoutRequest $request, $eventId)
    {
        $this->authorize('update', [EventLayout::class, $eventId]);

        $validated = $request->validated();

        $layout = EventLayout::updateOrCreate(
            ['event_id' => $eventId],
            [
                'id'               => EventLayout::where('event_id', $eventId)->value('id') ?? ('evtlay-' . Str::uuid()),
                'elements'         => $validated['elements'],
                'card_orientation' => $validated['card_orientation'] ?? 'landscape',
                'background_color' => $validated['background_color'] ?? '#13131e',
            ]
        );

        // Mark ALL cards in this event as "completed"
        Card::where('event_id', $eventId)->update(['status' => 'completed']);

        return response()->json([
            'event_id'         => $eventId,
            'has_layout'       => true,
            'elements'         => $layout->elements,
            'card_orientation' => $layout->card_orientation,
            'background_color' => $layout->background_color,
            'updated_at'       => $layout->updated_at,
        ]);
    }
}

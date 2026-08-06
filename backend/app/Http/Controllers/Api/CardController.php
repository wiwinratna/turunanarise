<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\Layout;
use App\Http\Requests\CardRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Card::with(['user', 'event', 'participant', 'layout']);

        if ($user->role === 'superadmin' || (isset($user->role->value) && $user->role->value === 'superadmin')) {
            if ($request->has('event_id')) {
                $query->where('event_id', $request->query('event_id'));
            }
        } else {
            $eventIds = is_array($user->event_id) ? $user->event_id : ($user->event_id ? [$user->event_id] : []);
            if (empty($eventIds)) {
                return response()->json([
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 0,
                    'per_page' => (int) $request->input('per_page', 20),
                ]);
            }
            $query->whereIn('event_id', $eventIds);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('id', 'LIKE', "%{$search}%")
                  ->orWhereHas('participant', function ($pq) use ($search) {
                      $pq->where('name', 'LIKE', "%{$search}%");
                  });
            });
        }

        $sort = $request->input('sort', 'created_at');
        $direction = strtolower($request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['name', 'created_at', 'updated_at', 'status', 'id'];
        
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) $request->input('per_page', 20);
        $cards = $query->paginate($perPage);

        return response()->json($cards);
    }

    public function store(CardRequest $request)
    {
        $user = $request->user();

        $validated = $request->validated();

        $eventId = $validated['event_id'];
        $this->authorize('create', [Card::class, clone request()->replace(['event_id' => $eventId])]);

        $card = Card::create([
            'id' => 'card-' . Str::uuid(),
            'participant_id' => $validated['participant_id'],
            'event_id' => $validated['event_id'],
            'card_orientation' => $validated['card_orientation'] ?? 'landscape',
            'background_color' => $validated['background_color'] ?? '#13131e',
            'status' => 'draft',
            'user_id' => $user->id,
        ]);

        return response()->json($card, 201);
    }

    public function show(Request $request, $id)
    {
        $card = Card::with(['user', 'event', 'participant', 'layout'])->findOrFail($id);
        $this->authorize('view', $card);

        return response()->json($card);
    }

    public function update(CardRequest $request, $id)
    {
        $card = Card::findOrFail($id);
        $this->authorize('update', $card);

        $validated = $request->validated();

        if (isset($validated['card_orientation'])) $card->card_orientation = $validated['card_orientation'];
        if (isset($validated['background_color'])) $card->background_color = $validated['background_color'];
        if (isset($validated['status'])) $card->status = $validated['status'];
        if (isset($validated['thumbnail_path'])) $card->thumbnail_path = $validated['thumbnail_path'];

        $card->save();

        return response()->json($card);
    }

    public function updateLayout(CardRequest $request, $id)
    {
        $card = Card::findOrFail($id);
        $this->authorize('update', $card);

        $validated = $request->validated();

        // Save layout configuration in layouts table
        $layout = Layout::updateOrCreate(
            ['card_id' => $card->id],
            [
                'id' => $card->layout ? $card->layout->id : ('lay-' . Str::uuid()),
                'elements' => $validated['elements']
            ]
        );

        if (isset($validated['card_orientation'])) $card->card_orientation = $validated['card_orientation'];
        if (isset($validated['background_color'])) $card->background_color = $validated['background_color'];

        // Manage state transition
        if ($card->status === 'draft') {
            $card->status = 'completed'; // When admin saves a valid layout, update card status from draft to completed
        } else if ($card->status === 'completed') {
            $card->status = 'updated'; // When layout is modified after completion, change status to updated
        }

        $card->save();

        // Load complete card response
        $updatedCard = Card::with(['user', 'event', 'participant', 'layout'])->find($card->id);

        return response()->json($updatedCard);
    }

    public function updateStatus(CardRequest $request, $id)
    {
        $card = Card::findOrFail($id);
        $this->authorize('update', $card);

        $validated = $request->validated();

        $card->status = $validated['status'];
        $card->save();

        return response()->json($card);
    }

    public function destroy(Request $request, $id)
    {
        $card = Card::findOrFail($id);
        $this->authorize('delete', $card);

        $card->delete();

        return response()->json(['message' => 'Card deleted successfully']);
    }

    public function export(Request $request, $id)
    {
        $card = Card::findOrFail($id);
        $this->authorize('view', $card);

        $card->status = 'completed';
        $card->save();

        return response()->json([
            'success' => true,
            'message' => 'Card status updated to completed successfully',
            'card' => $card
        ]);
    }

    public function whatsapp(CardRequest $request, $id)
    {
        $card = Card::findOrFail($id);
        $this->authorize('view', $card);

        $validated = $request->validated();

        $phone = preg_replace('/[^0-9]/', '', $validated['phone']);
        
        $text = "Here is your card from CardForge! 🪪\nName: " . $card->name;
        $waUrl = "https://wa.me/{$phone}?text=" . urlencode($text);

        // If card was in completed status and shared, we can keep it as is, or set status
        if ($card->status === 'draft') {
            $card->status = 'completed';
        }
        $card->save();

        return response()->json([
            'success' => true,
            'waUrl' => $waUrl,
            'message' => 'WhatsApp redirection link generated successfully'
        ]);
    }
}

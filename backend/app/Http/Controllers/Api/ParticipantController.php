<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use App\Models\Card;
use App\Models\Layout;
use App\Http\Requests\ParticipantRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ParticipantController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Participant::with(['event', 'card']);

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
                  ->orWhere('id', 'LIKE', "%{$search}%");
            });
        }

        $sort = $request->input('sort', 'created_at');
        $direction = strtolower($request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['name', 'created_at', 'updated_at', 'id'];
        
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) $request->input('per_page', 20);
        $participants = $query->paginate($perPage);

        return response()->json($participants);
    }

    public function store(ParticipantRequest $request)
    {
        $user = $request->user();

        // Handle either direct 'name' or combined firstName and lastName
        $firstName = $request->input('firstName', '');
        $lastName = $request->input('lastName', '');
        $fullName = $request->input('name');
        if (!$fullName) {
            $fullName = trim($firstName . ' ' . $lastName);
        }

        $validated = $request->validated();

        if (empty($fullName)) {
            return response()->json(['message' => 'The Name field is required.'], 422);
        }

        $eventId = $validated['event_id'];
        $this->authorize('create', [Participant::class, clone request()->replace(['event_id' => $eventId])]);

        // Handle base64 image upload
        $rawPayload = $validated['participant_data'] ?? $request->all();
        
        $processBase64 = function($base64Image) {
            if ($base64Image && str_starts_with($base64Image, 'data:image/')) {
                $parts = explode(';', $base64Image);
                if (count($parts) == 2) {
                    $type = $parts[0];
                    $data = explode(',', $parts[1]);
                    if (count($data) == 2) {
                        $decoded = base64_decode($data[1]);
                        $extension = explode('/', $type)[1] ?? 'jpg';
                        if ($extension === 'jpeg') $extension = 'jpg';
                        $filename = 'participants/' . \Illuminate\Support\Str::uuid() . '.' . $extension;
                        \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $decoded);
                        return asset('/storage/' . $filename);
                    }
                }
            } else if ($base64Image && str_starts_with($base64Image, 'http')) {
                return $base64Image;
            }
            return null;
        };

        $pictureUrl = $processBase64($rawPayload['picture'] ?? null);
        $documentUrl = $processBase64($rawPayload['uploadId'] ?? null);

        unset($rawPayload['uploadId']); // Do not store massive base64 strings in JSON to prevent max_allowed_packet errors
        unset($rawPayload['picture']);
        
        $primaryKeys = ['event_id', 'name', 'jobTitle', 'company', 'email', 'phone', 'idType', 'employeeId', 'category', 'function', 'nationality', 'firstName', 'lastName'];
        $customFields = array_diff_key($rawPayload, array_flip($primaryKeys));
        if ($pictureUrl) {
            $customFields['picture'] = $pictureUrl;
        }
        if ($documentUrl) {
            $customFields['uploadId'] = $documentUrl;
        }

        $event = \App\Models\Event::findOrFail($validated['event_id']);
        $eventCode = $event->event_code ?? 'EVT';
        $count = Participant::where('event_id', $event->id)->count() + 1;
        $participantId = $eventCode . '-P-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        while (Participant::where('id', $participantId)->exists()) {
            $count++;
            $participantId = $eventCode . '-P-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        }

        // Create participant
        $participant = Participant::create([
            'id' => $participantId,
            'event_id' => $validated['event_id'],
            'name' => $fullName,
            'job_title' => $validated['jobTitle'] ?? $request->input('job_title'),
            'company' => $validated['company'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'id_type' => $validated['idType'] ?? 'Employee ID',
            'employee_id' => $validated['employeeId'] ?? $request->input('employee_id'),
            'category_id' => $validated['category'],
            'function_id' => $validated['function'],
            'nationality' => $validated['nationality'],
            'custom_fields' => $customFields,
        ]);

        // Automatically create Card
        $cardId = 'card-' . Str::uuid();
        $card = Card::create([
            'id' => $cardId,
            'participant_id' => $participant->id,
            'event_id' => $participant->event_id,
            'status' => 'draft',
            'user_id' => $user->id,
            'card_orientation' => 'landscape',
            'background_color' => '#13131e',
        ]);

        // Automatically generate Layout
        $elements = [
            [ 'id' => 'photo', 'type' => 'photo', 'x' => 20, 'y' => 20, 'width' => 80, 'height' => 80, 'content' => 'Profile Photo', 'layer' => 1, 'borderRadius' => 50, 'imageUrl' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format' ],
            [ 'id' => 'name', 'type' => 'text', 'x' => 116, 'y' => 28, 'width' => 180, 'height' => 32, 'content' => $fullName, 'fontSize' => 18, 'fontWeight' => '700', 'color' => '#f0f0fa', 'layer' => 2 ],
            [ 'id' => 'title', 'type' => 'text', 'x' => 116, 'y' => 64, 'width' => 180, 'height' => 22, 'content' => $participant->job_title ?? 'Job Title', 'fontSize' => 11, 'fontWeight' => '400', 'color' => '#9090c0', 'layer' => 3 ],
            [ 'id' => 'company', 'type' => 'text', 'x' => 116, 'y' => 88, 'width' => 180, 'height' => 20, 'content' => $participant->company ?? 'Company', 'fontSize' => 11, 'fontWeight' => '500', 'color' => '#7c5cfc', 'layer' => 4 ],
            [ 'id' => 'divider', 'type' => 'divider', 'x' => 20, 'y' => 115, 'width' => 320, 'height' => 1, 'content' => '', 'bgColor' => 'rgba(255,255,255,0.1)', 'layer' => 5 ],
            [ 'id' => 'email-label', 'type' => 'text', 'x' => 20, 'y' => 128, 'width' => 80, 'height' => 16, 'content' => 'EMAIL', 'fontSize' => 8, 'fontWeight' => '600', 'color' => '#7070a0', 'layer' => 6 ],
            [ 'id' => 'email-val', 'type' => 'text', 'x' => 20, 'y' => 146, 'width' => 180, 'height' => 16, 'content' => $participant->email ?? 'email@company.com', 'fontSize' => 10, 'fontWeight' => '400', 'color' => '#c8c8e8', 'layer' => 7 ],
            [ 'id' => 'phone-label', 'type' => 'text', 'x' => 220, 'y' => 128, 'width' => 80, 'height' => 16, 'content' => 'PHONE', 'fontSize' => 8, 'fontWeight' => '600', 'color' => '#7070a0', 'layer' => 8 ],
            [ 'id' => 'phone-val', 'type' => 'text', 'x' => 220, 'y' => 146, 'width' => 120, 'height' => 16, 'content' => $participant->phone ?? 'Phone Number', 'fontSize' => 10, 'fontWeight' => '400', 'color' => '#c8c8e8', 'layer' => 9 ],
            [ 'id' => 'badge', 'type' => 'badge', 'x' => 20, 'y' => 175, 'width' => 90, 'height' => 22, 'content' => $participant->id_type, 'fontSize' => 9, 'color' => '#ffffff', 'bgColor' => '#7c5cfc', 'borderRadius' => 3, 'layer' => 10 ],
            [ 'id' => 'id-val', 'type' => 'text', 'x' => 118, 'y' => 178, 'width' => 100, 'height' => 18, 'content' => $participant->employee_id ?? 'EMP-ID', 'fontSize' => 10, 'fontWeight' => '500', 'color' => '#f0f0fa', 'layer' => 11 ]
        ];

        Layout::create([
            'id' => 'lay-' . Str::uuid(),
            'card_id' => $cardId,
            'elements' => $elements,
        ]);

        // Fetch populated Card
        $card = Card::with(['participant', 'event', 'layout'])->findOrFail($cardId);

        return response()->json([
            'participant' => $participant,
            'card' => $card
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $participant = Participant::with(['event', 'card'])->findOrFail($id);
        $this->authorize('view', $participant);

        return response()->json($participant);
    }

    public function update(ParticipantRequest $request, $id)
    {
        $participant = Participant::findOrFail($id);
        $this->authorize('update', $participant);

        // Check if updating event_id is allowed
        if ($request->has('event_id') && $request->input('event_id') !== $participant->event_id) {
            $this->authorize('create', [Participant::class, clone request()->replace(['event_id' => $request->input('event_id')])]);
        }

        $validated = $request->validated();

        if (isset($validated['name'])) $participant->name = $validated['name'];
        if (isset($validated['jobTitle'])) $participant->job_title = $validated['jobTitle'];
        if (isset($validated['company'])) $participant->company = $validated['company'];
        if (isset($validated['email'])) $participant->email = $validated['email'];
        if (isset($validated['phone'])) $participant->phone = $validated['phone'];
        if (isset($validated['idType'])) $participant->id_type = $validated['idType'];
        if (isset($validated['employeeId'])) $participant->employee_id = $validated['employeeId'];
        if (isset($validated['category'])) $participant->category_id = $validated['category'];
        if (isset($validated['function'])) $participant->function_id = $validated['function'];
        if (isset($validated['nationality'])) $participant->nationality = $validated['nationality'];

        $participant->save();

        // Update elements text content inside Layout automatically if present
        $card = $participant->card;
        if ($card && $card->layout) {
            $layout = $card->layout;
            $elements = $layout->elements;
            foreach ($elements as &$el) {
                if ($el['id'] === 'name') $el['content'] = $participant->name;
                if ($el['id'] === 'title') $el['content'] = $participant->job_title ?? 'Job Title';
                if ($el['id'] === 'company') $el['content'] = $participant->company ?? 'Company';
                if ($el['id'] === 'email-val') $el['content'] = $participant->email ?? 'email@company.com';
                if ($el['id'] === 'phone-val') $el['content'] = $participant->phone ?? 'Phone Number';
                if ($el['id'] === 'badge') $el['content'] = $participant->id_type ?? 'Employee ID';
                if ($el['id'] === 'id-val') $el['content'] = $participant->employee_id ?? 'EMP-ID';
            }
            $layout->elements = $elements;
            $layout->save();

            // Set card status to updated if it was completed
            if ($card->status === 'completed') {
                $card->status = 'updated';
                $card->save();
            }
        }

        return response()->json($participant);
    }

    public function destroy(Request $request, $id)
    {
        $participant = Participant::findOrFail($id);
        $this->authorize('delete', $participant);

        $participant->delete(); // automatically deletes linked card & layout due to cascades

        return response()->json(['message' => 'Participant deleted successfully']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Message;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function getContacts(Request $request)
    {
        $user = $request->user();

        // If superadmin, get all admins and superadmins (excluding self)
        // If admin, get all superadmins
        if ($user->role === 'superadmin') {
            $contacts = User::where('id', '!=', $user->id)
                ->whereIn('role', ['admin', 'superadmin'])
                ->get(['id', 'name', 'email', 'role', 'avatar']);
        } else {
            $contacts = User::where('role', 'superadmin')
                ->get(['id', 'name', 'email', 'role', 'avatar']);
        }

        // Attach unread count for each contact
        foreach ($contacts as $contact) {
            $contact->unread_count = Message::where('sender_id', $contact->id)
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->count();
        }

        return response()->json($contacts);
    }

    public function getMessages(Request $request, $userId)
    {
        $user = $request->user();

        $messages = Message::where(function ($query) use ($user, $userId) {
            $query->where('sender_id', $user->id)
                  ->where('receiver_id', $userId);
        })->orWhere(function ($query) use ($user, $userId) {
            $query->where('sender_id', $userId)
                  ->where('receiver_id', $user->id);
        })->orderBy('created_at', 'asc')->get();

        return response()->json($messages);
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string'
        ]);

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $request->receiver_id,
            'message' => $request->message,
            'is_read' => false
        ]);

        // Load relationships if needed, or return the created message
        return response()->json($message, 201);
    }

    public function markAsRead(Request $request, $userId)
    {
        $user = $request->user();

        Message::where('sender_id', $userId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }
}

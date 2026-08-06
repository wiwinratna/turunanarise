<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Ticket;
use App\Models\Message;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role->value === 'superadmin') {
            // Return open tickets and tickets assigned to me
            $openTickets = Ticket::with(['creator:id,name,avatar'])
                ->where('status', 'open')
                ->orderBy('created_at', 'desc')
                ->get();
            
            $myTickets = Ticket::with(['creator:id,name,avatar'])
                ->where('assignee_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            $unreadCount = Message::whereHas('ticket', function ($q) use ($user) {
                    $q->where('assignee_id', $user->id)->orWhere('status', 'open');
                })
                ->where('sender_id', '!=', $user->id)
                ->where('is_read', false)
                ->count();

            return response()->json([
                'open' => $openTickets,
                'my_tickets' => $myTickets,
                'unread_count' => $unreadCount
            ]);
        } else {
            // Admin only sees their own tickets
            $tickets = Ticket::with(['assignee:id,name,avatar'])
                ->where('creator_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            $unreadCount = Message::whereHas('ticket', function ($q) use ($user) {
                    $q->where('creator_id', $user->id);
                })
                ->where('sender_id', '!=', $user->id)
                ->where('is_read', false)
                ->count();

            return response()->json([
                'tickets' => $tickets,
                'unread_count' => $unreadCount
            ]);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'nullable|string',
            'attachment' => 'nullable|image|max:2048' // Max 2MB
        ]);

        $ticket = Ticket::create([
            'creator_id' => $request->user()->id,
            'subject' => $request->subject,
            'status' => 'open'
        ]);

        if ($request->filled('message') || $request->hasFile('attachment')) {
            $this->createMessage($request, $ticket->id);
        } else {
            // Only send new ticket email if we didn't just create a message
            // (createMessage will handle sending the email if there is one)
            $superadmins = User::where('role', 'superadmin')->get();
            foreach ($superadmins as $admin) {
                Mail::to($admin->email)->send(new \App\Mail\TicketNotificationMail(
                    'New Support Ticket Created',
                    $admin->name,
                    "A new support ticket titled '{$ticket->subject}' has been created by {$request->user()->name}.",
                    $ticket->subject
                ));
            }
        }

        return response()->json($ticket->load('creator:id,name,avatar'), 201);
    }

    public function assign(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        
        if ($ticket->status !== 'open') {
            return response()->json(['message' => 'Ticket is not open'], 400);
        }

        $ticket->update([
            'assignee_id' => $request->user()->id,
            'status' => 'in_progress'
        ]);

        return response()->json($ticket);
    }

    public function solve(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        
        $ticket->update([
            'status' => 'solved'
        ]);

        return response()->json($ticket);
    }

    public function getMessages(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        
        // Mark as read for this user
        Message::where('ticket_id', $id)
            ->where('sender_id', '!=', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = Message::with(['sender:id,name,avatar'])
            ->where('ticket_id', $id)
            ->orderBy('created_at', 'asc')
            ->get();

        foreach ($messages as $msg) {
            if ($msg->attachment_path) {
                $msg->attachment_url = '/storage/' . $msg->attachment_path;
            }
        }

        return response()->json([
            'ticket' => $ticket->load(['creator:id,name,avatar', 'assignee:id,name,avatar']),
            'messages' => $messages
        ]);
    }

    public function storeMessage(Request $request, $id)
    {
        return response()->json($this->createMessage($request, $id), 201);
    }

    private function createMessage(Request $request, $ticketId)
    {
        $request->validate([
            'message' => 'nullable|string',
            'attachment' => 'nullable|image|max:2048' // 2MB max
        ]);

        if (!$request->filled('message') && !$request->hasFile('attachment')) {
            abort(422, 'Message or attachment is required.');
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('chat_attachments', 'public');
            $attachmentPath = $path;
        }

        $message = Message::create([
            'ticket_id' => $ticketId,
            'sender_id' => $request->user()->id,
            'message' => $request->message,
            'attachment_path' => $attachmentPath,
            'is_read' => false
        ]);

        $message->load('sender:id,name,avatar');
        
        if ($message->attachment_path) {
            $message->attachment_url = '/storage/' . $message->attachment_path;
        }

        // Send email notification
        $ticket = Ticket::find($ticketId);
        if ($request->user()->role->value === 'superadmin') {
            // Superadmin replied, email the creator
            $creator = User::find($ticket->creator_id);
            if ($creator) {
                Mail::to($creator->email)->send(new \App\Mail\TicketNotificationMail(
                    'New Reply on Your Ticket',
                    $creator->name,
                    "A Super Admin has replied to your ticket '{$ticket->subject}'.",
                    $ticket->subject
                ));
            }
        } else {
            // User replied, email the assignee or all superadmins if unassigned
            if ($ticket->assignee_id) {
                $assignee = User::find($ticket->assignee_id);
                if ($assignee) {
                    Mail::to($assignee->email)->send(new \App\Mail\TicketNotificationMail(
                        'New Reply on Assigned Ticket',
                        $assignee->name,
                        "{$request->user()->name} has replied to the ticket '{$ticket->subject}'.",
                        $ticket->subject
                    ));
                }
            } else {
                $superadmins = User::where('role', 'superadmin')->get();
                foreach ($superadmins as $admin) {
                    Mail::to($admin->email)->send(new \App\Mail\TicketNotificationMail(
                        'New Ticket / Reply from User',
                        $admin->name,
                        "{$request->user()->name} has sent a message on ticket '{$ticket->subject}'.",
                        $ticket->subject
                    ));
                }
            }
        }

        return $message;
    }
}

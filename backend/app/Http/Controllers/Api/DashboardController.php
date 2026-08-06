<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        $isSuper = ($user->role === 'superadmin' || $user->role->value === 'superadmin');

        if ($isSuper) {
            $totalCards = Card::count();
            $exports = Card::whereIn('status', ['completed', 'updated'])->count();
            $activeUsers = User::where('active', true)->count();
            $totalEvents = Event::where('active', true)->count();
            $formsSubmitted = $totalCards; // Matches registered cards
            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            $chartData = [];
            foreach ($months as $i => $m) {
                // Mock historical data, put actual data in current month (August = index 7)
                $chartData[] = [
                    'name' => $m,
                    'cards' => ($i == 7) ? $totalCards : rand(10, 50),
                    'tickets' => ($i == 7) ? \App\Models\Ticket::count() : rand(0, 5)
                ];
            }

            return response()->json([
                'totalCards' => $totalCards,
                'formsSubmitted' => $formsSubmitted,
                'exports' => $exports,
                'activeUsers' => $activeUsers,
                'totalEvents' => $totalEvents,
                'chartData' => array_slice($chartData, 0, 8) // Jan to Aug
            ]);
        } else {
            $eventIds = is_array($user->event_id) ? $user->event_id : ($user->event_id ? [$user->event_id] : []);
            if (empty($eventIds)) {
                return response()->json([
                    'totalCards' => 0,
                    'formsSubmitted' => 0,
                    'exports' => 0,
                    'activeUsers' => 1,
                    'totalEvents' => 0,
                    'chartData' => []
                ]);
            }

            $totalCards = Card::whereIn('event_id', $eventIds)->count();
            $exports = Card::whereIn('event_id', $eventIds)->whereIn('status', ['completed', 'updated'])->count();
            $formsSubmitted = $totalCards; // Matches registered cards
            
            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
            $chartData = [];
            foreach ($months as $i => $m) {
                $chartData[] = [
                    'name' => $m,
                    'cards' => ($i == 7) ? $totalCards : rand(5, 20),
                ];
            }

            return response()->json([
                'totalCards' => $totalCards,
                'formsSubmitted' => $formsSubmitted,
                'exports' => $exports,
                'activeUsers' => 2, // Stub for event team members
                'totalEvents' => count($eventIds),
                'chartData' => $chartData
            ]);
        }
    }
}

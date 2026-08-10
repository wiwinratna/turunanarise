<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\EventLayoutController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\ParticipantController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FunctionController;
use App\Http\Controllers\Api\CountryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ChatController;

use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\SettingsController;

Route::get('/storage/{path}', function (string $path) {
    $filePath = storage_path('app/public/' . $path);
    if (!file_exists($filePath)) {
        abort(404);
    }
    return response()->file($filePath);
})->where('path', '.*');

// Route::post('/auth/register', [AuthController::class, 'register']); // Disabled public registration
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Public settings
Route::get('/settings/branding', [SettingsController::class, 'getBranding']);

// ─── Protected routes (requires Sanctum token) ──────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/me', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);

    // Tickets
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::put('/tickets/{id}/assign', [TicketController::class, 'assign']);
    Route::put('/tickets/{id}/solve', [TicketController::class, 'solve']);
    Route::get('/tickets/{id}/messages', [TicketController::class, 'getMessages']);
    Route::post('/tickets/{id}/messages', [TicketController::class, 'storeMessage']);

    // Branding
    Route::get('/settings/branding', [SettingsController::class, 'getBranding']);
    Route::post('/settings/branding', [SettingsController::class, 'updateBranding']);
    Route::post('/settings/upload', [SettingsController::class, 'uploadImage']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Superadmin-only user management (except update for self which is handled by policy)
    Route::apiResource('/users', UserController::class);

    // Events management (Admins are scoped within the controller)
    Route::get('/events/check-code', [EventController::class, 'checkCode']);
    Route::apiResource('/events', EventController::class);
    Route::get('/events/{eventId}/layout', [EventLayoutController::class, 'show']);
    Route::put('/events/{eventId}/layout', [EventLayoutController::class, 'update']);

    // Participants management
    Route::apiResource('/participants', ParticipantController::class);

    // Cards CRUD + Export + Share
    Route::apiResource('/cards', CardController::class);
    Route::put('/cards/{id}/layout', [CardController::class, 'updateLayout']);
    Route::put('/cards/{id}/status', [CardController::class, 'updateStatus']);
    Route::post('/cards/{id}/share', [CardController::class, 'whatsapp']);
    Route::post('/cards/{id}/export', [CardController::class, 'export']);
    Route::post('/cards/{id}/whatsapp', [CardController::class, 'whatsapp']);

    // Master Data (all authenticated users can view/CRUD)
    Route::apiResource('/categories', CategoryController::class);
    Route::apiResource('/functions', FunctionController::class);
    Route::apiResource('/countries', CountryController::class);
});

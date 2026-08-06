<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\Api\ParticipantController;
use Illuminate\Http\Request;

try {
    $request = new Request([], [
        'event_id' => 'evt-1782193555695',
        'name' => 'Test User',
        'participant_data' => [
            'firstName' => 'Test',
            'lastName' => 'User'
        ]
    ]);
    $controller = new ParticipantController();
    $response = $controller->store($request);
    echo "SUCCESS\n";
    echo $response->getContent();
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}

<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('role', 'superadmin')->first();

echo json_encode(app('App\Http\Controllers\Api\TicketController')->index(request()->setUserResolver(function() use ($user) { return $user; }))->getData());

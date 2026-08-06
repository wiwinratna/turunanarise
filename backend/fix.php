<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    DB::statement('ALTER TABLE cards MODIFY participant_data LONGTEXT;');
    echo "Modified existing column\n";
} catch (\Exception $e) {
    if (strpos($e->getMessage(), 'Unknown column') !== false) {
        DB::statement('ALTER TABLE cards ADD participant_data LONGTEXT;');
        echo "Added new column\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$rows = DB::select('SHOW CREATE TABLE participants');
echo "PARTICIPANTS TABLE:\n";
echo $rows[0]->{'Create Table'} . "\n\n";

$rows2 = DB::select('SHOW CREATE TABLE cards');
echo "CARDS TABLE:\n";
echo $rows2[0]->{'Create Table'} . "\n";

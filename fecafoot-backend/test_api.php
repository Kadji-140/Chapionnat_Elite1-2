<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::create('/api/mobile/competitions/Elite 1/details', 'GET')
);
echo "--- Elite 1 ---\n";
echo $response->getContent();
echo "\n\n";

$response2 = $kernel->handle(
    $request2 = Illuminate\Http\Request::create('/api/mobile/competitions/Elite 2/details', 'GET')
);
echo "--- Elite 2 ---\n";
echo $response2->getContent();
echo "\n";

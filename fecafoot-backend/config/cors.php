<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', '*'],
    
    'allowed_methods' => ['*'],
    
    'allowed_origins' => ['*'],
    
    
    'allowed_origins_patterns' => [
        '#^http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:517[3-4]$#',
    ],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => [],
    
    'max_age' => 0,
    
    'supports_credentials' => true,
];
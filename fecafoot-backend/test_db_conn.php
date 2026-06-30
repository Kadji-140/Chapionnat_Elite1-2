<?php
$host = "localhost";
$port = 5432;
$dbname = "fecafoot_db";
$user = "postgres";

$passwords = ["root1234", "", "root", "postgres"];

foreach ($passwords as $pwd) {
    try {
        echo "Testing connection with password: '$pwd'...\n";
        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
        $pdo = new PDO($dsn, $user, $pwd, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        echo "SUCCESS! Connected successfully with password: '$pwd'\n";
        exit(0);
    } catch (PDOException $e) {
        echo "FAILED: " . $e->getMessage() . "\n";
    }
}

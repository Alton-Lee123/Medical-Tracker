// needs actual database information, currently just a shell to be updated
<?php

function getDBConnection() {
    $host = "localhost";
    $dbname = "medical_tracker";
    $username = "root";
    $password = "";

    try {
        $pdo = new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );

        return $pdo;

    } catch (PDOException $e) {
        die("Database connection failed: " . $e->getMessage());
    }
}

<?php
function getDB() {
    $host = "localhost";
    $db   = "medical_tracker";
    $user = "root";
    $pass = "";

    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

    try {
        return new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    } catch (PDOException $e) {
        die(json_encode(["error" => "DB connection failed"]));
    }
}

<?php
require_once "db.php";

$user_id = $_GET['user_id'];

$pdo = getDB();

$stmt = $pdo->prepare("
    SELECT m.name, t.time_of_day
    FROM medications m
    JOIN medication_times t ON m.id = t.medication_id
    WHERE m.user_id = ?
");

$stmt->execute([$user_id]);

echo json_encode($stmt->fetchAll());

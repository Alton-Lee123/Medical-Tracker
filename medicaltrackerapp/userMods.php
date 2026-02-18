<?php
require_once "db.php";

$user_id = $_GET['user_id'] ?? 0;

$pdo = getDB();

$stmt = $pdo->prepare("
    SELECT m.id, m.name, m.dosage, t.time_of_day
    FROM medications m
    JOIN medication_times t ON m.id = t.medication_id
    WHERE m.user_id = ?
");

$stmt->execute([$user_id]);

$meds = $stmt->fetchAll();

echo json_encode($meds);

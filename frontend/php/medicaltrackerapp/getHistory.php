<?php
require_once "db.php";

$user_id = $_GET['user_id'];

$pdo = getDB();

$stmt = $pdo->prepare("
    SELECT m.name, l.status, l.taken_time
    FROM medication_logs l
    JOIN medications m ON m.id = l.medication_id
    WHERE l.user_id = ?
    ORDER BY l.taken_time DESC
");

$stmt->execute([$user_id]);

echo json_encode($stmt->fetchAll());

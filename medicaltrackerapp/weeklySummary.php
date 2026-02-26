<?php
require_once "db.php";

$user_id = $_GET['user_id'];

$pdo = getDB();

$stmt = $pdo->prepare("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status='taken' THEN 1 ELSE 0 END) as taken
    FROM medication_logs
    WHERE user_id = ?
");

$stmt->execute([$user_id]);
$data = $stmt->fetch();

$percentage = ($data['taken'] / max($data['total'],1)) * 100;

echo json_encode([
    "taken" => $data['taken'],
    "total" => $data['total'],
    "adherence" => round($percentage,2)
]);
<?php
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'];
$med_id = $data['med_id'];
$status = $data['status']; // taken or missed

$pdo = getDB();

$stmt = $pdo->prepare("
    INSERT INTO medication_logs 
    (user_id, medication_id, scheduled_time, taken_time, status)
    VALUES (?, ?, NOW(), NOW(), ?)
");

$stmt->execute([$user_id, $med_id, $status]);

echo json_encode(["success" => true]);

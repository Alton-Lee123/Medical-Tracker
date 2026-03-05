<?php
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'];
$token = $data['token'];

$pdo = getDB();

$stmt = $pdo->prepare("UPDATE users SET device_token = ? WHERE id = ?");
$stmt->execute([$token, $user_id]);

echo json_encode(["success" => true]);

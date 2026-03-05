<?php
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'];
$old = $data['old_password'];
$new = $data['new_password'];

$pdo = getDB();

$stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!password_verify($old, $user['password'])) {
    echo json_encode(["success"=>false,"message"=>"Wrong password"]);
    exit;
}

$newHash = password_hash($new, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("UPDATE users SET password=? WHERE id=?");
$stmt->execute([$newHash,$user_id]);

echo json_encode(["success"=>true]);
<?php
require_once "db.php";

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

$pdo = getDB();

$stmt = $pdo->prepare("SELECT id, name, password FROM users WHERE email = ?");
$stmt->execute([$email]);

$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    echo json_encode([
        "success" => true,
        "user_id" => $user['id'],
        "name" => $user['name']
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid login"]);
}

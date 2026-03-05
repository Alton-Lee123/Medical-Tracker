<?php
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$token = $data['token'] ?? '';
$newPassword = $data['password'] ?? '';

if (!$token || !$newPassword) {
    echo json_encode(["success" => false, "message" => "Missing data"]);
    exit;
}

$pdo = getDB();

/* Find matching user */
$stmt = $pdo->prepare("
    SELECT id, reset_expires 
    FROM users 
    WHERE reset_token = ?
");
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(["success" => false, "message" => "Invalid token"]);
    exit;
}

/* Check expiry */
if (strtotime($user['reset_expires']) < time()) {
    echo json_encode(["success" => false, "message" => "Token expired"]);
    exit;
}

/* Hash new password */
$hashed = password_hash($newPassword, PASSWORD_DEFAULT);

/* Update password + clear token */
$stmt = $pdo->prepare("
    UPDATE users 
    SET password = ?, reset_token = NULL, reset_expires = NULL
    WHERE id = ?
");
$stmt->execute([$hashed, $user['id']]);

echo json_encode(["success" => true, "message" => "Password updated"]);
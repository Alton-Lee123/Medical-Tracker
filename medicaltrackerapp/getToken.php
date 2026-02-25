<?php
require_once "db.php";

$email = $_POST['email'] ?? '';

if (!$email) {
    echo json_encode(["success" => false, "message" => "Email required"]);
    exit;
}

$pdo = getDB();

/* Check user exists */
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(["success" => false, "message" => "Email not found"]);
    exit;
}

/* Generate secure token */
$token = bin2hex(random_bytes(32));
$expiry = date("Y-m-d H:i:s", strtotime("+1 hour"));

/* Save token */
$stmt = $pdo->prepare("
    UPDATE users 
    SET reset_token = ?, reset_expires = ?
    WHERE email = ?
");
$stmt->execute([$token, $expiry, $email]);

/* Build reset link */
$resetLink = "https://medicaltracker/reset.html?token=" . $token;

/* TODO: send email */
mail($email, "Password Reset", "Click this link: $resetLink");

/* Response */
echo json_encode([
    "success" => true,
    "message" => "Reset link sent"
]);
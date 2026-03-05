<?php
require_once "db.php";
require_once "sendNotification.php";

$user_id = 1;

$pdo = getDB();

$stmt = $pdo->prepare("SELECT device_token FROM users WHERE id = ?");
$stmt->execute([$user_id]);

$user = $stmt->fetch();

if ($user && $user['device_token']) {

    sendPushNotification(
        $user['device_token'],
        "New Prescription",
        "A new medication has been added to your account"
    );
}

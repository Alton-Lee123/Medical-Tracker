<?php
require_once "db.php";
require_once "sendNotification.php";

$pdo = getDB();

/* find scheduled meds with no log after 1 hour */
$stmt = $pdo->query("
    SELECT u.device_token, m.name, t.time_of_day
    FROM medications m
    JOIN medication_times t ON m.id = t.medication_id
    JOIN users u ON u.id = m.user_id
    LEFT JOIN medication_logs l 
        ON l.medication_id = m.id 
        AND DATE(l.scheduled_time) = CURDATE()
    WHERE l.id IS NULL
");

$rows = $stmt->fetchAll();

foreach ($rows as $row) {
    sendPushNotification(
        $row['device_token'],
        "Missed Medication",
        "You may have missed your {$row['name']}"
    );
}
<?php
require_once "db.php";

function sendPushNotification($deviceToken, $title, $message) {

    $serverKey = "YOUR_FIREBASE_SERVER_KEY_HERE";

    $data = [
        "to" => $deviceToken,
        "notification" => [
            "title" => $title,
            "body" => $message,
            "sound" => "default"
        ]
    ];

    $headers = [
        "Authorization: key=" . $serverKey,
        "Content-Type: application/json"
    ];

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, ""); //set specific notifcation format
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}

<?php
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$pdo = getDB();

$stmt = $pdo->prepare("
    INSERT INTO medications (user_id, name, dosage, instructions)
    VALUES (?, ?, ?, ?)
");

$stmt->execute([
    $data['user_id'],
    $data['name'],
    $data['dosage'],
    $data['instructions']
]);

$med_id = $pdo->lastInsertId();
// a
/* Insert times */
foreach ($data['times'] as $time) {
    $t = $pdo->prepare("
        INSERT INTO medication_times (medication_id, time_of_day)
        VALUES (?, ?)
    ");
    $t->execute([$med_id, $time]);
}

echo json_encode(["success" => true]);

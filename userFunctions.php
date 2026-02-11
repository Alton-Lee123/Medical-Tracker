<?php
require_once "db.php";

/**
 * 
 * @param string $table
 * @param array $conditions  (['email' => 'test@mail.com'])
 * @return array|false
 */

function fetchSingleRecord($table, $conditions = []) {

    $pdo = getDBConnection();

    $sql = "SELECT * FROM $table";

    if (!empty($conditions)) {
        $sql .= " WHERE ";
        $fields = [];
        foreach ($conditions as $field => $value) {
            $fields[] = "$field = :$field";
        }
        $sql .= implode(" AND ", $fields);
    }

    $stmt = $pdo->prepare($sql);

    foreach ($conditions as $field => $value) {
        $stmt->bindValue(":$field", $value);
    }

    $stmt->execute();

    return $stmt->fetch();
}
function fetchMultipleRecords($table, $conditions = []) {

    $pdo = getDBConnection();

    $sql = "SELECT * FROM $table";

    if (!empty($conditions)) {
        $sql .= " WHERE ";
        $fields = [];
        foreach ($conditions as $field => $value) {
            $fields[] = "$field = :$field";
        }
        $sql .= implode(" AND ", $fields);
    }

    $stmt = $pdo->prepare($sql);

    foreach ($conditions as $field => $value) {
        $stmt->bindValue(":$field", $value);
    }

    $stmt->execute();

    return $stmt->fetchAll();
}

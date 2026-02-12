function insertRecord($table, $data) {
    $pdo = getDBConnection();

    $fields = implode(",", array_keys($data));
    $placeholders = ":" . implode(", :", array_keys($data));

    $sql = "INSERT INTO $table ($fields) VALUES ($placeholders)";
    $stmt = $pdo->prepare($sql);

    foreach ($data as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }

    return $stmt->execute();
}
function updateRecord($table, $data, $conditions)

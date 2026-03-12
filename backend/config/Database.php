<?php

class Database {
    private $host     = 'localhost';
    private $db       = 'medtrack';
    private $user     = 'medtrack';
    private $password = 'medtrack_password';
    private $conn;

    public function connect() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                'mysql:host=' . $this->host . ';dbname=' . $this->db,
                $this->user,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
            exit;
        }

        return $this->conn;
    }
}

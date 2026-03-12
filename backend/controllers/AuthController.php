<?php

class AuthController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function register($body) {
        if (empty($body['name']) || empty($body['surname']) || empty($body['email']) || empty($body['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'All fields are required']);
            return;
        }

        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$body['email']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already registered']);
            return;
        }

        $hash = password_hash($body['password'], PASSWORD_BCRYPT);
        $role = $body['role'] ?? 'patient';

        $stmt = $this->db->prepare('
            INSERT INTO users (name, surname, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([$body['name'], $body['surname'], $body['email'], $hash, $role]);
        $userId = $this->db->lastInsertId();

        if ($role === 'patient') {
            $stmt = $this->db->prepare('INSERT INTO patients (user_id) VALUES (?)');
            $stmt->execute([$userId]);
        } elseif ($role === 'doctor') {
            $stmt = $this->db->prepare('INSERT INTO doctors (user_id) VALUES (?)');
            $stmt->execute([$userId]);
        }

        http_response_code(201);
        echo json_encode([
            'message' => 'User registered successfully',
            'user_id' => $userId
        ]);
    }

    public function login($body) {
        if (empty($body['email']) || empty($body['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password are required']);
            return;
        }

        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$body['email']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($body['password'], $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid email or password']);
            return;
        }

        $token = bin2hex(random_bytes(32));

        $this->ensureTokensTable();

        $stmt = $this->db->prepare('
            INSERT INTO tokens (user_id, token, expires_at)
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
            ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)
        ');
        $stmt->execute([$user['id'], $token]);

        echo json_encode([
            'token'   => $token,
            'user_id' => $user['id'],
            'name'    => $user['name'],
            'surname' => $user['surname'],
            'role'    => $user['role']
        ]);
    }

    public function logout() {
        $token = $this->getBearerToken();
        if ($token) {
            $stmt = $this->db->prepare('DELETE FROM tokens WHERE token = ?');
            $stmt->execute([$token]);
        }
        echo json_encode(['message' => 'Logged out successfully']);
    }

    public function getBearerToken() {
        $headers = getallheaders();
        if (!empty($headers['Authorization'])) {
            if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    private function ensureTokensTable() {
        $this->db->exec('
            CREATE TABLE IF NOT EXISTS tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                token VARCHAR(64) NOT NULL,
                expires_at DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ');
    }
}

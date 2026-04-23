<?php

class AdminController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ── users ─────────────────────────────────────────────────────────────────

    public function getAllUsers() {
        $stmt = $this->db->prepare('
            SELECT id, name, surname, email, role, status, created_at
            FROM users
            ORDER BY role, surname ASC
        ');
        $stmt->execute();
        echo json_encode($stmt->fetchAll());
    }

    public function updateUser($id, $body) {
        $fields = [];
        $values = [];

        if (isset($body['name']))    { $fields[] = 'name = ?';    $values[] = $body['name']; }
        if (isset($body['surname'])) { $fields[] = 'surname = ?'; $values[] = $body['surname']; }
        if (isset($body['email']))   { $fields[] = 'email = ?';   $values[] = $body['email']; }
        if (isset($body['role']))    { $fields[] = 'role = ?';    $values[] = $body['role']; }
        if (isset($body['status']))  { $fields[] = 'status = ?';  $values[] = $body['status']; }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }

        $values[] = $id;
        $stmt = $this->db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($values);
        echo json_encode(['message' => 'User updated']);
    }

    public function deleteUser($id) {
        $stmt = $this->db->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['message' => 'User deleted']);
    }

    // ── doctors ───────────────────────────────────────────────────────────────

    public function getAllDoctors() {
        $stmt = $this->db->prepare('
            SELECT d.id, d.user_id, d.specialization, d.status,
                   u.name, u.surname, u.email,
                   COUNT(p.id) AS patient_count
            FROM doctors d
            JOIN users u ON u.id = d.user_id
            LEFT JOIN patients p ON p.doctor_id = d.id
            GROUP BY d.id
            ORDER BY u.surname ASC
        ');
        $stmt->execute();
        echo json_encode($stmt->fetchAll());
    }

    public function updateDoctor($id, $body) {
        $fields = [];
        $values = [];

        if (isset($body['specialization'])) { $fields[] = 'specialization = ?'; $values[] = $body['specialization']; }
        if (isset($body['status']))         { $fields[] = 'status = ?';         $values[] = $body['status']; }

        if (!empty($fields)) {
            $values[] = $id;
            $stmt = $this->db->prepare('UPDATE doctors SET ' . implode(', ', $fields) . ' WHERE id = ?');
            $stmt->execute($values);
        }

        if (!empty($body['user_id']) && (!empty($body['name']) || !empty($body['surname']) || !empty($body['email']))) {
            $uFields = [];
            $uValues = [];
            if (isset($body['name']))    { $uFields[] = 'name = ?';    $uValues[] = $body['name']; }
            if (isset($body['surname'])) { $uFields[] = 'surname = ?'; $uValues[] = $body['surname']; }
            if (isset($body['email']))   { $uFields[] = 'email = ?';   $uValues[] = $body['email']; }
            $uValues[] = $body['user_id'];
            $stmt = $this->db->prepare('UPDATE users SET ' . implode(', ', $uFields) . ' WHERE id = ?');
            $stmt->execute($uValues);
        }

        echo json_encode(['message' => 'Doctor updated']);
    }

    // ── Patients ──────────────────────────────────────────────────────────────

    public function getAllPatients() {
        $stmt = $this->db->prepare('
            SELECT p.id, p.user_id, p.date_of_birth, p.`condition`, p.status,
                   u.name, u.surname, u.email,
                   d.id AS doctor_id,
                   du.name AS doctor_name, du.surname AS doctor_surname,
                   COUNT(m.id) AS medication_count
            FROM patients p
            JOIN users u ON u.id = p.user_id
            LEFT JOIN doctors d ON d.id = p.doctor_id
            LEFT JOIN users du ON du.id = d.user_id
            LEFT JOIN medications m ON m.patient_id = p.id
            GROUP BY p.id
            ORDER BY u.surname ASC
        ');
        $stmt->execute();
        echo json_encode($stmt->fetchAll());
    }

    public function updatePatient($id, $body) {
        $fields = [];
        $values = [];

        if (isset($body['condition'])) { $fields[] = '`condition` = ?'; $values[] = $body['condition']; }
        if (isset($body['status']))    { $fields[] = 'status = ?';      $values[] = $body['status']; }
        if (isset($body['doctor_id'])) { $fields[] = 'doctor_id = ?';   $values[] = $body['doctor_id']; }

        if (!empty($fields)) {
            $values[] = $id;
            $stmt = $this->db->prepare('UPDATE patients SET ' . implode(', ', $fields) . ' WHERE id = ?');
            $stmt->execute($values);
        }

        if (!empty($body['user_id']) && (!empty($body['name']) || !empty($body['surname']) || !empty($body['email']))) {
            $uFields = [];
            $uValues = [];
            if (isset($body['name']))    { $uFields[] = 'name = ?';    $uValues[] = $body['name']; }
            if (isset($body['surname'])) { $uFields[] = 'surname = ?'; $uValues[] = $body['surname']; }
            if (isset($body['email']))   { $uFields[] = 'email = ?';   $uValues[] = $body['email']; }
            $uValues[] = $body['user_id'];
            $stmt = $this->db->prepare('UPDATE users SET ' . implode(', ', $uFields) . ' WHERE id = ?');
            $stmt->execute($uValues);
        }

        echo json_encode(['message' => 'Patient updated']);
    }

    // ── stats ─────────────────────────────────────────────────────────────────

    public function getStats() {
        $stats = [];

        $stmt = $this->db->query('SELECT COUNT(*) AS total, role FROM users GROUP BY role');
        $stats['users'] = $stmt->fetchAll();

        $stmt = $this->db->query('SELECT COUNT(*) AS total FROM doctors');
        $stats['doctors'] = $stmt->fetchColumn();

        $stmt = $this->db->query('SELECT COUNT(*) AS total FROM patients');
        $stats['patients'] = $stmt->fetchColumn();

        $stmt = $this->db->query('SELECT COUNT(*) AS total FROM medications');
        $stats['medications'] = $stmt->fetchColumn();

        $stmt = $this->db->query('SELECT COUNT(*) AS total FROM prescriptions');
        $stats['prescriptions'] = $stmt->fetchColumn();

        $stmt = $this->db->query('SELECT COUNT(*) AS total FROM messages');
        $stats['messages'] = $stmt->fetchColumn();

        echo json_encode($stats);
    }
}

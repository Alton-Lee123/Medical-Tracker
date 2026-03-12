<?php

class PatientController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $stmt = $this->db->prepare('
            SELECT
                p.id, p.date_of_birth, p.`condition`, p.user_id,
                u.name, u.surname, u.email,
                d.id AS doctor_id
            FROM patients p
            JOIN users u ON u.id = p.user_id
            LEFT JOIN doctors d ON d.id = p.doctor_id
        ');
        $stmt->execute();
        echo json_encode($stmt->fetchAll());
    }

    public function getOne($id) {
        // Support lookup by user_id or patient id
        $stmt = $this->db->prepare('
            SELECT
                p.id, p.date_of_birth, p.`condition`, p.user_id,
                u.name, u.surname, u.email
            FROM patients p
            JOIN users u ON u.id = p.user_id
            WHERE p.id = ? OR p.user_id = ?
        ');
        $stmt->execute([$id, $id]);
        $patient = $stmt->fetch();

        if (!$patient) {
            http_response_code(404);
            echo json_encode(['error' => 'Patient not found']);
            return;
        }

        // Fetch their medications
        $stmt = $this->db->prepare('SELECT * FROM medications WHERE patient_id = ?');
        $stmt->execute([$patient['id']]);
        $patient['medications'] = $stmt->fetchAll();

        echo json_encode($patient);
    }
}

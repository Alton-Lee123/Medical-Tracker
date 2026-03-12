<?php

class PatientController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $stmt = $this->db->prepare('
            SELECT
                p.id, p.date_of_birth, p.`condition`,
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
        $stmt = $this->db->prepare('
            SELECT
                p.id, p.date_of_birth, p.`condition`,
                u.name, u.surname, u.email
            FROM patients p
            JOIN users u ON u.id = p.user_id
            WHERE p.id = ?
        ');
        $stmt->execute([$id]);
        $patient = $stmt->fetch();

        if (!$patient) {
            http_response_code(404);
            echo json_encode(['error' => 'Patient not found']);
            return;
        }

        // Also fetch their medications
        $stmt = $this->db->prepare('SELECT * FROM medications WHERE patient_id = ?');
        $stmt->execute([$id]);
        $patient['medications'] = $stmt->fetchAll();

        echo json_encode($patient);
    }
}

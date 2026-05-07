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
                p.gender, p.allergies, p.previous_injuries, p.last_hospital_visit,
                u.name, u.surname, u.email,
                d.id AS doctor_id,
                COUNT(m.id) AS medication_count
            FROM patients p
            JOIN users u ON u.id = p.user_id
            LEFT JOIN doctors d ON d.id = p.doctor_id
            LEFT JOIN medications m ON m.patient_id = p.id
            GROUP BY p.id
        ');
        $stmt->execute();
        $patients = $stmt->fetchAll();

        foreach ($patients as &$patient) {
            $patient['adherence'] = $this->calcAdherence($patient['id']);
        }

        echo json_encode($patients);
    }

    public function getOne($id) {
        $stmt = $this->db->prepare('
            SELECT
                p.id, p.date_of_birth, p.`condition`, p.user_id,
                p.gender, p.allergies, p.previous_injuries, p.last_hospital_visit,
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

        $stmt = $this->db->prepare('SELECT * FROM medications WHERE patient_id = ?');
        $stmt->execute([$patient['id']]);
        $patient['medications'] = $stmt->fetchAll();

        $patient['adherence'] = $this->calcAdherence($patient['id']);

        echo json_encode($patient);
    }

    private function calcAdherence($patientId) {
        $stmt = $this->db->prepare('SELECT id FROM medications WHERE patient_id = ?');
        $stmt->execute([$patientId]);
        $meds = $stmt->fetchAll();

        if (empty($meds)) return null;

        $medIds       = array_column($meds, 'id');
        $total        = count($meds) * 30;
        $placeholders = implode(',', array_fill(0, count($medIds), '?'));

        $stmt = $this->db->prepare("
            SELECT COUNT(DISTINCT CONCAT(medication_id, '-', taken_date)) AS taken
            FROM medication_logs
            WHERE medication_id IN ($placeholders)
              AND taken_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $stmt->execute($medIds);
        $row   = $stmt->fetch();
        $taken = (int)($row['taken'] ?? 0);

        return $total > 0 ? round(($taken / $total) * 100) : 0;
    }

    public function updateProfile($id, $body) {
        $stmt = $this->db->prepare('SELECT id FROM patients WHERE id = ? OR user_id = ?');
        $stmt->execute([$id, $id]);
        $row = $stmt->fetch();
        if (!$row) { http_response_code(404); echo json_encode(['error' => 'Patient not found']); return; }

        $patientId = $row['id'];
        $stmt = $this->db->prepare('
            UPDATE patients SET
                gender               = COALESCE(:gender,               gender),
                allergies            = COALESCE(:allergies,            allergies),
                previous_injuries    = COALESCE(:previous_injuries,    previous_injuries),
                last_hospital_visit  = :last_hospital_visit,
                date_of_birth        = COALESCE(:date_of_birth,        date_of_birth)
            WHERE id = :id
        ');
        $stmt->execute([
            ':gender'              => $body['gender']              ?? null,
            ':allergies'           => $body['allergies']           ?? null,
            ':previous_injuries'   => $body['previous_injuries']   ?? null,
            ':last_hospital_visit' => !empty($body['last_hospital_visit']) ? $body['last_hospital_visit'] : null,
            ':date_of_birth'       => !empty($body['date_of_birth'])       ? $body['date_of_birth']       : null,
            ':id'                  => $patientId,
        ]);
        echo json_encode(['success' => true]);
    }
}

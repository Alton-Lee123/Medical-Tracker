<?php

class PrescriptionController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll($patientId) {
        $stmt = $this->db->prepare('
            SELECT p.*, u.name AS doctor_name, u.surname AS doctor_surname
            FROM prescriptions p
            JOIN doctors d ON d.id = p.doctor_id
            JOIN users u ON u.id = d.user_id
            WHERE p.patient_id = ?
            ORDER BY p.start_date DESC
        ');
        $stmt->execute([$patientId]);
        echo json_encode($stmt->fetchAll());
    }

    public function add($body) {
        if (empty($body['patient_id']) || empty($body['doctor_id']) || empty($body['medication']) || empty($body['dose']) || empty($body['frequency'])) {
            http_response_code(400);
            echo json_encode(['error' => 'All fields are required']);
            return;
        }

        $stmt = $this->db->prepare('
            INSERT INTO prescriptions (patient_id, doctor_id, medication, dose, frequency, start_date, refill_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $body['patient_id'],
            $body['doctor_id'],
            $body['medication'],
            $body['dose'],
            $body['frequency'],
            $body['start_date'] ?? date('Y-m-d'),
            $body['refill_date'] ?? null,
            $body['status'] ?? 'active'
        ]);

        http_response_code(201);
        echo json_encode([
            'message' => 'Prescription created',
            'id'      => $this->db->lastInsertId()
        ]);
    }

    public function update($id, $body) {
        $stmt = $this->db->prepare('
            UPDATE prescriptions SET medication = ?, dose = ?, frequency = ?, refill_date = ?, status = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $body['medication'],
            $body['dose'],
            $body['frequency'],
            $body['refill_date'] ?? null,
            $body['status'] ?? 'active',
            $id
        ]);
        echo json_encode(['message' => 'Prescription updated']);
    }

    public function delete($id) {
        $stmt = $this->db->prepare('DELETE FROM prescriptions WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Prescription deleted']);
    }
}

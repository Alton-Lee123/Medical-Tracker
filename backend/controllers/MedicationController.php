<?php

class MedicationController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll($patientId) {
        $stmt = $this->db->prepare('SELECT * FROM medications WHERE patient_id = ?');
        $stmt->execute([$patientId]);
        echo json_encode($stmt->fetchAll());
    }

    public function add($body) {
        if (empty($body['patient_id']) || empty($body['name']) || empty($body['dose']) || empty($body['frequency']) || empty($body['time'])) {
            http_response_code(400);
            echo json_encode(['error' => 'All fields are required']);
            return;
        }

        $stmt = $this->db->prepare('
            INSERT INTO medications (patient_id, name, dose, frequency, time)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $body['patient_id'],
            $body['name'],
            $body['dose'],
            $body['frequency'],
            $body['time']
        ]);

        http_response_code(201);
        echo json_encode([
            'message' => 'Medication added',
            'id'      => $this->db->lastInsertId()
        ]);
    }

    public function update($id, $body) {
        $stmt = $this->db->prepare('
            UPDATE medications SET name = ?, dose = ?, frequency = ?, time = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $body['name'],
            $body['dose'],
            $body['frequency'],
            $body['time'],
            $id
        ]);
        echo json_encode(['message' => 'Medication updated']);
    }

    public function delete($id) {
        $stmt = $this->db->prepare('DELETE FROM medications WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Medication deleted']);
    }

    public function logTaken($medicationId) {
        $now = new DateTime();
        $stmt = $this->db->prepare('
            INSERT INTO medication_logs (medication_id, taken_date, taken_time)
            VALUES (?, ?, ?)
        ');
        $stmt->execute([
            $medicationId,
            $now->format('Y-m-d'),
            $now->format('H:i:s')
        ]);

        http_response_code(201);
        echo json_encode(['message' => 'Dose logged']);
    }

    public function getLogs($medicationId) {
        $stmt = $this->db->prepare('
            SELECT * FROM medication_logs WHERE medication_id = ? ORDER BY taken_date DESC, taken_time DESC
        ');
        $stmt->execute([$medicationId]);
        echo json_encode($stmt->fetchAll());
    }
}

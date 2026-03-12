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
        if (empty($body['patient_id']) || empty($body['medication']) || empty($body['dose']) || empty($body['frequency'])) {
            http_response_code(400);
            echo json_encode(['error' => 'patient_id, medication, dose and frequency are required']);
            return;
        }

        // Accept either doctor_id (doctors.id) or doctor_user_id (users.id) and resolve to doctors.id
        if (!empty($body['doctor_id'])) {
            // Check if it's a doctors.id directly
            $stmt = $this->db->prepare('SELECT id FROM doctors WHERE id = ?');
            $stmt->execute([$body['doctor_id']]);
            $doctor = $stmt->fetch();

            if (!$doctor) {
                // Try treating it as a users.id instead
                $stmt = $this->db->prepare('SELECT id FROM doctors WHERE user_id = ?');
                $stmt->execute([$body['doctor_id']]);
                $doctor = $stmt->fetch();
            }
        }

        if (empty($doctor)) {
            http_response_code(400);
            echo json_encode(['error' => 'Doctor not found']);
            return;
        }

        $doctorId = $doctor['id'];
        $today    = date('Y-m-d');
        $refill   = date('Y-m-d', strtotime('+3 months'));

        $stmt = $this->db->prepare('
            INSERT INTO prescriptions (patient_id, doctor_id, medication, dose, frequency, start_date, refill_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $body['patient_id'],
            $doctorId,
            $body['medication'],
            $body['dose'],
            $body['frequency'],
            $body['start_date'] ?? $today,
            $body['refill_date'] ?? $refill,
            $body['status']     ?? 'active'
        ]);

        http_response_code(201);
        echo json_encode([
            'message' => 'Prescription created',
            'id'      => $this->db->lastInsertId()
        ]);
    }

    public function update($id, $body) {
        // Build update dynamically so partial updates work
        $fields = [];
        $values = [];

        if (isset($body['medication']))  { $fields[] = 'medication = ?';  $values[] = $body['medication']; }
        if (isset($body['dose']))        { $fields[] = 'dose = ?';        $values[] = $body['dose']; }
        if (isset($body['frequency']))   { $fields[] = 'frequency = ?';   $values[] = $body['frequency']; }
        if (isset($body['refill_date'])) { $fields[] = 'refill_date = ?'; $values[] = $body['refill_date']; }
        if (isset($body['status']))      { $fields[] = 'status = ?';      $values[] = $body['status']; }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }

        $values[] = $id;
        $stmt = $this->db->prepare('UPDATE prescriptions SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($values);
        echo json_encode(['message' => 'Prescription updated']);
    }

    public function delete($id) {
        $stmt = $this->db->prepare('DELETE FROM prescriptions WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Prescription deleted']);
    }
}

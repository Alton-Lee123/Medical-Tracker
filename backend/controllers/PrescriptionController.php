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

        $doctor = null;
        if (!empty($body['doctor_id'])) {
            $stmt = $this->db->prepare('SELECT id FROM doctors WHERE id = ?');
            $stmt->execute([$body['doctor_id']]);
            $doctor = $stmt->fetch();

            if (!$doctor) {
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

        $doctorId  = $doctor['id'];
        $patientId = $body['patient_id'];
        $today     = date('Y-m-d');
        $refill    = date('Y-m-d', strtotime('+3 months'));

        $timeMap = [
            'Once daily'        => '08:00:00',
            'Twice daily'       => '08:00:00',
            'Three times daily' => '08:00:00',
            'As needed'         => '08:00:00',
        ];
        $medTime = $body['time'] ?? ($timeMap[$body['frequency']] ?? '08:00:00');

        $stmt = $this->db->prepare('
            INSERT INTO prescriptions (patient_id, doctor_id, medication, dose, frequency, start_date, refill_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $patientId,
            $doctorId,
            $body['medication'],
            $body['dose'],
            $body['frequency'],
            $body['start_date'] ?? $today,
            $body['refill_date'] ?? $refill,
            $body['status']     ?? 'active'
        ]);
        $prescriptionId = $this->db->lastInsertId();

        // get medicin
        $stmt = $this->db->prepare('
            SELECT id FROM medications
            WHERE patient_id = ? AND name = ? AND dose = ? AND frequency = ?
        ');
        $stmt->execute([$patientId, $body['medication'], $body['dose'], $body['frequency']]);
        $existing = $stmt->fetch();

        if (!$existing) {
            $stmt = $this->db->prepare('
                INSERT INTO medications (patient_id, name, dose, frequency, time)
                VALUES (?, ?, ?, ?, ?)
            ');
            $stmt->execute([$patientId, $body['medication'], $body['dose'], $body['frequency'], $medTime]);
            $medicationId = $this->db->lastInsertId();
        } else {
            $medicationId = $existing['id'];
        }

        http_response_code(201);
        echo json_encode([
            'message'       => 'Prescription created',
            'id'            => $prescriptionId,
            'medication_id' => $medicationId
        ]);
    }

    public function update($id, $body) {
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
        // remove record when the drug is stopped
        $stmt = $this->db->prepare('SELECT medication, dose, frequency, patient_id FROM prescriptions WHERE id = ?');
        $stmt->execute([$id]);
        $rx = $stmt->fetch();

        if ($rx) {
            $stmt = $this->db->prepare('
                DELETE FROM medications
                WHERE patient_id = ? AND name = ? AND dose = ? AND frequency = ?
            ');
            $stmt->execute([$rx['patient_id'], $rx['medication'], $rx['dose'], $rx['frequency']]);
        }

        $stmt = $this->db->prepare('DELETE FROM prescriptions WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Prescription deleted']);
    }
}
<?php

class AppointmentController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll($patientId) {
        $stmt = $this->db->prepare('
            SELECT a.*, u.name AS doctor_name, u.surname AS doctor_surname
            FROM appointments a
            JOIN doctors d ON d.id = a.doctor_id
            JOIN users u ON u.id = d.user_id
            WHERE a.patient_id = ?
            ORDER BY a.date ASC, a.time ASC
        ');
        $stmt->execute([$patientId]);
        echo json_encode($stmt->fetchAll());
    }

    public function add($body) {
        if (empty($body['patient_id']) || empty($body['doctor_id']) || empty($body['title']) || empty($body['date']) || empty($body['time'])) {
            http_response_code(400);
            echo json_encode(['error' => 'All fields are required']);
            return;
        }

        $stmt = $this->db->prepare('
            INSERT INTO appointments (patient_id, doctor_id, title, date, time)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $body['patient_id'],
            $body['doctor_id'],
            $body['title'],
            $body['date'],
            $body['time']
        ]);

        http_response_code(201);
        echo json_encode([
            'message' => 'Appointment created',
            'id'      => $this->db->lastInsertId()
        ]);
    }

    public function update($id, $body) {
        $stmt = $this->db->prepare('
            UPDATE appointments SET title = ?, date = ?, time = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $body['title'],
            $body['date'],
            $body['time'],
            $id
        ]);
        echo json_encode(['message' => 'Appointment updated']);
    }

    public function delete($id) {
        $stmt = $this->db->prepare('DELETE FROM appointments WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Appointment deleted']);
    }
}

<?php

class MessageController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // get threads
    public function getThreads($userId) {
        $stmt = $this->db->prepare('
            SELECT
                m.id, m.sender_id, m.receiver_id, m.body, m.sent_at, m.is_read,
                s.name AS sender_name,   s.surname AS sender_surname,
                r.name AS receiver_name, r.surname AS receiver_surname
            FROM messages m
            JOIN users s ON s.id = m.sender_id
            JOIN users r ON r.id = m.receiver_id
            WHERE m.sender_id = ? OR m.receiver_id = ?
            ORDER BY m.sent_at ASC
        ');
        $stmt->execute([$userId, $userId]);
        echo json_encode($stmt->fetchAll());
    }

    // get thread singlwe
    public function getThread($userId, $otherId) {
        $stmt = $this->db->prepare('
            SELECT
                m.id, m.sender_id, m.receiver_id, m.body, m.sent_at, m.is_read,
                s.name AS sender_name, s.surname AS sender_surname
            FROM messages m
            JOIN users s ON s.id = m.sender_id
            WHERE (m.sender_id = ? AND m.receiver_id = ?)
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.sent_at ASC
        ');
        $stmt->execute([$userId, $otherId, $otherId, $userId]);
        echo json_encode($stmt->fetchAll());
    }

    public function send($body) {
        if (empty($body['sender_id']) || empty($body['receiver_id']) || empty($body['body'])) {
            http_response_code(400);
            echo json_encode(['error' => 'sender_id, receiver_id and body are required']);
            return;
        }

        $stmt = $this->db->prepare('
            INSERT INTO messages (sender_id, receiver_id, body)
            VALUES (?, ?, ?)
        ');
        $stmt->execute([$body['sender_id'], $body['receiver_id'], $body['body']]);

        http_response_code(201);
        echo json_encode([
            'message' => 'Message sent',
            'id'      => $this->db->lastInsertId()
        ]);
    }

    public function markRead($messageId) {
        $stmt = $this->db->prepare('UPDATE messages SET is_read = TRUE WHERE id = ?');
        $stmt->execute([$messageId]);
        echo json_encode(['message' => 'Marked as read']);
    }
}

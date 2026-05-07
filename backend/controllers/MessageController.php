<?php

class MessageController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    private function rows($stmt) {
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function userNameExpr($alias) {
        return "TRIM(CONCAT(COALESCE($alias.name, ''), ' ', COALESCE($alias.surname, '')))";
    }

    // GET /api/messages/{userId}
    // Returns every message where the logged-in user's users.id is either sender_id or receiver_id.
    public function getThreads($userId) {
        // TEMP DIAGNOSTIC — remove once fixed
        if (isset($_GET['debug'])) {
            $raw = $userId;
            $cast = (int)$userId;
            $stmt = $this->db->prepare('SELECT COUNT(*) FROM messages WHERE sender_id = ? OR receiver_id = ?');
            $stmt->execute([$cast, $cast]);
            $countExact = (int)$stmt->fetchColumn();
            $stmt2 = $this->db->prepare('SELECT COUNT(*) FROM messages WHERE CAST(sender_id AS UNSIGNED) = ? OR CAST(receiver_id AS UNSIGNED) = ?');
            $stmt2->execute([$cast, $cast]);
            $countCast = (int)$stmt2->fetchColumn();
            $sample = $this->db->query('SELECT id, sender_id, receiver_id, CHAR_LENGTH(sender_id) as sid_len FROM messages LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
                'rawUserId'       => $raw,
                'castedUserId'    => $cast,
                'countExact'      => $countExact,
                'countWithCast'   => $countCast,
                'sampleRows'      => $sample,
                'database'        => $this->db->query('SELECT DATABASE()')->fetchColumn(),
            ]);
            return;
        }

        $userId = (int)$userId;

        // Keep this query intentionally simple. The mobile app needs message rows first;
        // names are optional and should never cause messages to disappear.
        $stmt = $this->db->prepare('
            SELECT
                m.id,
                m.sender_id,
                m.receiver_id,
                m.body,
                m.sent_at,
                m.is_read,
                NULLIF(TRIM(CONCAT(COALESCE(s.name, \'\'), \' \', COALESCE(s.surname, \'\'))), \'\') AS sender_name,
                NULLIF(TRIM(CONCAT(COALESCE(r.name, \'\'), \' \', COALESCE(r.surname, \'\'))), \'\') AS receiver_name
            FROM messages m
            LEFT JOIN users s ON s.id = m.sender_id
            LEFT JOIN users r ON r.id = m.receiver_id
            WHERE CAST(m.sender_id AS UNSIGNED) = ?
               OR CAST(m.receiver_id AS UNSIGNED) = ?
            ORDER BY m.sent_at ASC, m.id ASC
        ');
        $stmt->execute([$userId, $userId]);
        $rows = $this->rows($stmt);

        // Fallback: if joins/schema differences cause trouble, still return the raw messages.
        if (empty($rows)) {
            $fallback = $this->db->prepare('
                SELECT id, sender_id, receiver_id, body, sent_at, is_read
                FROM messages
                WHERE CAST(sender_id AS UNSIGNED) = ?
                   OR CAST(receiver_id AS UNSIGNED) = ?
                ORDER BY sent_at ASC, id ASC
            ');
            $fallback->execute([$userId, $userId]);
            $rows = $this->rows($fallback);
        }

        echo json_encode($rows);
    }

    // GET /api/messages/thread/{userId}/{otherId}
    public function getThread($userId, $otherId) {
        $userId = (int)$userId;
        $otherId = (int)$otherId;

        $stmt = $this->db->prepare('
            SELECT
                m.id,
                m.sender_id,
                m.receiver_id,
                m.body,
                m.sent_at,
                m.is_read,
                NULLIF(TRIM(CONCAT(COALESCE(s.name, \'\'), \' \', COALESCE(s.surname, \'\'))), \'\') AS sender_name,
                NULLIF(TRIM(CONCAT(COALESCE(r.name, \'\'), \' \', COALESCE(r.surname, \'\'))), \'\') AS receiver_name
            FROM messages m
            LEFT JOIN users s ON s.id = m.sender_id
            LEFT JOIN users r ON r.id = m.receiver_id
            WHERE (CAST(m.sender_id AS UNSIGNED) = ? AND CAST(m.receiver_id AS UNSIGNED) = ?)
               OR (CAST(m.sender_id AS UNSIGNED) = ? AND CAST(m.receiver_id AS UNSIGNED) = ?)
            ORDER BY m.sent_at ASC, m.id ASC
        ');
        $stmt->execute([$userId, $otherId, $otherId, $userId]);
        echo json_encode($this->rows($stmt));
    }

    // POST /api/messages
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
        $stmt->execute([(int)$body['sender_id'], (int)$body['receiver_id'], $body['body']]);

        http_response_code(201);
        echo json_encode([
            'message' => 'Message sent',
            'id' => $this->db->lastInsertId()
        ]);
    }

    public function markRead($messageId) {
        $stmt = $this->db->prepare('UPDATE messages SET is_read = TRUE WHERE id = ?');
        $stmt->execute([(int)$messageId]);
        echo json_encode(['message' => 'Marked as read']);
    }
}
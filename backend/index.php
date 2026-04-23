<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config/Database.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', trim($uri, '/'));

while (!empty($uri) && $uri[0] !== 'api') {
    array_shift($uri);
}

$resource    = $uri[1] ?? null;
$subresource = $uri[2] ?? null;
$action      = $uri[3] ?? null;

$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true);
$db     = (new Database())->connect();

$loggedInUserId = null;
$headers = getallheaders();
if (!empty($headers['Authorization'])) {
    if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        $token = $matches[1];
        $stmt  = $db->prepare('SELECT user_id FROM tokens WHERE token = ? AND expires_at > NOW()');
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        if ($row) $loggedInUserId = (int)$row['user_id'];
    }
}

require_once 'routes/api.php';

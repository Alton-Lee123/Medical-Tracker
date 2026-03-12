<?php
echo "reached routes";
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config/Database.php';

// Parse the URL
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', trim($uri, '/'));

// Remove 'medtrack/backend' prefix from uri
// e.g. /medtrack/backend/api/auth/login -> ['api', 'auth', 'login']
while (!empty($uri) && $uri[0] !== 'api') {
    array_shift($uri);
}

$resource    = $uri[1] ?? null; // auth, patients, messages etc.
$subresource = $uri[2] ?? null; // login, register, {id} etc.
$action      = $uri[3] ?? null; // taken, read etc.

$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true);
$db     = (new Database())->connect();


require_once 'routes/api.php';

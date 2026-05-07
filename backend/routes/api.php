<?php

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/PatientController.php';
require_once __DIR__ . '/../controllers/MessageController.php';
require_once __DIR__ . '/../controllers/MedicationController.php';
require_once __DIR__ . '/../controllers/AppointmentController.php';
require_once __DIR__ . '/../controllers/PrescriptionController.php';

$auth         = new AuthController($db);
$patient      = new PatientController($db);
$message      = new MessageController($db);
$medication   = new MedicationController($db);
$appointment  = new AppointmentController($db);
$prescription = new PrescriptionController($db);

switch ($resource) {

    case 'auth':
        if      ($subresource === 'register' && $method === 'POST') $auth->register($body);
        elseif  ($subresource === 'login'    && $method === 'POST') $auth->login($body);
        elseif  ($subresource === 'logout'   && $method === 'POST') $auth->logout();
        else    http_response_code(404);
        break;

    case 'patients':
        if      ($method === 'GET' && !$subresource) $patient->getAll();
        elseif  ($method === 'GET' &&  $subresource) $patient->getOne($subresource);
        elseif  ($method === 'PUT' &&  $subresource) $patient->updateProfile($subresource, $body);
        else    http_response_code(404);
        break;

    case 'medications':
        if      ($method === 'GET'    &&  $subresource && !$action)              $medication->getAll($subresource);
        elseif  ($method === 'POST'   && !$subresource)                          $medication->add($body);
        elseif  ($method === 'PUT'    &&  $subresource)                          $medication->update($subresource, $body);
        elseif  ($method === 'DELETE' &&  $subresource)                          $medication->delete($subresource);
        elseif  ($method === 'POST'   &&  $subresource && $action === 'taken')   $medication->logTaken($subresource);
        elseif  ($method === 'GET'    &&  $subresource && $action === 'logs')    $medication->getLogs($subresource);
        else    http_response_code(404);
        break;

    case 'appointments':
        if      ($method === 'GET'    &&  $subresource && !$action) $appointment->getAll($subresource);
        elseif  ($method === 'POST'   && !$subresource)             $appointment->add($body);
        elseif  ($method === 'PUT'    &&  $subresource)             $appointment->update($subresource, $body);
        elseif  ($method === 'DELETE' &&  $subresource)             $appointment->delete($subresource);
        else    http_response_code(404);
        break;

    case 'prescriptions':
        if      ($method === 'GET'    &&  $subresource && !$action) $prescription->getAll($subresource);
        elseif  ($method === 'POST'   && !$subresource)             $prescription->add($body);
        elseif  ($method === 'PUT'    &&  $subresource)             $prescription->update($subresource, $body);
        elseif  ($method === 'DELETE' &&  $subresource)             $prescription->delete($subresource);
        else    http_response_code(404);
        break;

    case 'messages':
        // GET /api/messages                       → all threads for logged-in user
        if      ($method === 'GET'   && !$subresource)                           $message->getThreads($loggedInUserId);
        // GET /api/messages/{userId}              → all threads for the given user (Flutter passes userId in URL)
        elseif  ($method === 'GET'   &&  $subresource && !$action)               $message->getThreads($subresource);
        // GET /api/messages/{userId}/thread/{otherId} → single thread between two users
        elseif  ($method === 'GET'   &&  $subresource && $action)                $message->getThread($subresource, $action);
        // POST /api/messages                      → send a message
        elseif  ($method === 'POST'  && !$subresource)                           $message->send($body);
        // PATCH /api/messages/{id}/read           → mark as read
        elseif  ($method === 'PATCH' &&  $subresource && $action === 'read')     $message->markRead($subresource);
        else    http_response_code(404);
        break;

    case 'admin':
        require_once __DIR__ . '/../controllers/AdminController.php';
        $admin = new AdminController($db);
        if      ($method === 'GET' && $subresource === 'stats')           $admin->getStats();
        elseif  ($method === 'GET' && $subresource === 'users')           $admin->getAllUsers();
        elseif  ($method === 'PUT' && $subresource === 'users' && $action) $admin->updateUser($action, $body);
        elseif  ($method === 'GET' && $subresource === 'doctors')         $admin->getAllDoctors();
        elseif  ($method === 'PUT' && $subresource === 'doctors' && $action) $admin->updateDoctor($action, $body);
        elseif  ($method === 'GET' && $subresource === 'patients')        $admin->getAllPatients();
        elseif  ($method === 'PUT' && $subresource === 'patients' && $action) $admin->updatePatient($action, $body);
        else    http_response_code(404);
    break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
        break;
}
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
        if      ($method === 'GET'  && !$subresource)  $patient->getAll();
        elseif  ($method === 'GET'  &&  $subresource)  $patient->getOne($subresource);
        else    http_response_code(404);
        break;

    case 'medications':
        // /api/medications/{patientId}
        if      ($method === 'GET'    &&  $subresource && !$action) $medication->getAll($subresource);
        // /api/medications
        elseif  ($method === 'POST'   && !$subresource)             $medication->add($body);
        // /api/medications/{id}/update
        elseif  ($method === 'PUT'    &&  $subresource)             $medication->update($subresource, $body);
        // /api/medications/{id}/delete
        elseif  ($method === 'DELETE' &&  $subresource)             $medication->delete($subresource);
        // /api/medications/{id}/taken
        elseif  ($method === 'POST'   &&  $subresource && $action === 'taken') $medication->logTaken($subresource);
        // /api/medications/{id}/logs
        elseif  ($method === 'GET'    &&  $subresource && $action === 'logs')  $medication->getLogs($subresource);
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
        if      ($method === 'GET'   && !$subresource)               $message->getThreads();
        elseif  ($method === 'GET'   &&  $subresource)               $message->getThread($subresource);
        elseif  ($method === 'POST'  && !$subresource)               $message->send($body);
        elseif  ($method === 'PATCH' &&  $subresource && $action === 'read') $message->markRead($subresource);
        else    http_response_code(404);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
        break;
}

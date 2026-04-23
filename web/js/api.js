const API_URL = 'http://localhost/medtrack/backend/api';

function getToken() { return localStorage.getItem('medtrack_token'); }
function getUser()  { const u = localStorage.getItem('medtrack_user'); return u ? JSON.parse(u) : null; }

function saveAuth(data) {
    localStorage.setItem('medtrack_token', data.token);
    localStorage.setItem('medtrack_user', JSON.stringify({
        id:      data.user_id,
        name:    data.name,
        surname: data.surname,
        role:    data.role
    }));
}

function clearAuth() {
    localStorage.removeItem('medtrack_token');
    localStorage.removeItem('medtrack_user');
}

async function apiFetch(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token   = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(API_URL + endpoint, options);
    const data     = await response.json();

    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ── auth ──────────────────────────────────────────────────────────────────────
async function apiRegister(name, surname, email, password, role) {
    return await apiFetch('/auth/register', 'POST', { name, surname, email, password, role });
}
async function apiLogin(email, password) {
    const data = await apiFetch('/auth/login', 'POST', { email, password });
    saveAuth(data);
    return data;
}
async function apiLogout() {
    await apiFetch('/auth/logout', 'POST');
    clearAuth();
}

// ── Patients ──────────────────────────────────────────────────────────────────
async function apiGetPatients()  { return await apiFetch('/patients'); }
async function apiGetPatient(id) { return await apiFetch('/patients/' + id); }

// ── Medications ───────────────────────────────────────────────────────────────
async function apiGetMedications(patientId)                           { return await apiFetch('/medications/' + patientId); }
async function apiAddMedication(patientId, name, dose, frequency, time) { return await apiFetch('/medications', 'POST', { patient_id: patientId, name, dose, frequency, time }); }
async function apiUpdateMedication(id, name, dose, frequency, time)   { return await apiFetch('/medications/' + id, 'PUT', { name, dose, frequency, time }); }
async function apiDeleteMedication(id)                                { return await apiFetch('/medications/' + id, 'DELETE'); }
async function apiLogTaken(medicationId)                              { return await apiFetch('/medications/' + medicationId + '/taken', 'POST'); }
async function apiGetMedicationLogs(medicationId)                     { return await apiFetch('/medications/' + medicationId + '/logs'); }

// ── Appointments ──────────────────────────────────────────────────────────────
async function apiGetAppointments(patientId)                          { return await apiFetch('/appointments/' + patientId); }
async function apiAddAppointment(patientId, doctorId, title, date, time) { return await apiFetch('/appointments', 'POST', { patient_id: patientId, doctor_id: doctorId, title, date, time }); }
async function apiDeleteAppointment(id)                               { return await apiFetch('/appointments/' + id, 'DELETE'); }

// ── Prescriptions ─────────────────────────────────────────────────────────────
async function apiGetPrescriptions(patientId) { return await apiFetch('/prescriptions/' + patientId); }
async function apiAddPrescription(data)       { return await apiFetch('/prescriptions', 'POST', data); }
async function apiUpdatePrescription(id, data){ return await apiFetch('/prescriptions/' + id, 'PUT', data); }
async function apiDeletePrescription(id)      { return await apiFetch('/prescriptions/' + id, 'DELETE'); }

// ── Messages ──────────────────────────────────────────────────────────────────
async function apiGetThreads()                          { return await apiFetch('/messages'); }
async function apiGetThread(userId)                     { return await apiFetch('/messages/' + userId); }
async function apiSendMessage(senderId, receiverId, body) { return await apiFetch('/messages', 'POST', { sender_id: senderId, receiver_id: receiverId, body }); }
async function apiMarkRead(messageId)                   { return await apiFetch('/messages/' + messageId + '/read', 'PATCH'); }

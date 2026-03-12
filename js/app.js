// Main Application Logic

// ── Auth UI ───────────────────────────────────────────────────────────────────

async function handleLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    try {
        const data = await apiLogin(email, password);
        document.getElementById('login-screen').classList.add('hidden');
        switchLayout(data.role);
        await initAppData();
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
    }
}

async function handleRegister() {
    const name     = document.getElementById('reg-name').value.trim();
    const surname  = document.getElementById('reg-surname').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const role     = document.getElementById('reg-role').value;
    const errorEl  = document.getElementById('register-error');
    try {
        await apiRegister(name, surname, email, password, role);
        const data = await apiLogin(email, password);
        document.getElementById('register-screen').classList.add('hidden');
        switchLayout(data.role);
        await initAppData();
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
    }
}

function showRegister() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

window.addEventListener('load', async function() {
    const user = getUser();
    if (user && getToken()) {
        document.getElementById('login-screen').classList.add('hidden');
        switchLayout(user.role);
        await initAppData();
    }
});

// ── Layout ────────────────────────────────────────────────────────────────────

const mobileLayout        = document.getElementById('mobile-layout');
const desktopLayout       = document.getElementById('desktop-layout');
const roleSelector        = document.getElementById('role-selector');
const roleSelectorDesktop = document.getElementById('role-selector-desktop');
const doctorNav           = document.getElementById('doctor-nav');
const adminNav            = document.getElementById('admin-nav');

function switchLayout(role) {
    if (role === 'patient') {
        mobileLayout.classList.remove('hidden');
        desktopLayout.classList.add('hidden');
        loadPatientDashboard();
    } else if (role === 'doctor') {
        mobileLayout.classList.add('hidden');
        desktopLayout.classList.remove('hidden');
        doctorNav.classList.remove('hidden');
        adminNav.classList.add('hidden');
        showDoctorPage('dashboard');
    } else if (role === 'admin') {
        mobileLayout.classList.add('hidden');
        desktopLayout.classList.remove('hidden');
        doctorNav.classList.add('hidden');
        adminNav.classList.remove('hidden');
    }
    roleSelector.value        = role;
    roleSelectorDesktop.value = role;
}

roleSelector.addEventListener('change', function() { switchLayout(this.value); });
roleSelectorDesktop.addEventListener('change', function() { switchLayout(this.value); });

// ── Patient Dashboard ─────────────────────────────────────────────────────────

function loadPatientDashboard() {
    showPatientPage('dashboard');
    setCurrentDate();
    updateAdherenceRate();
    loadMedications();
}

function setCurrentDate() {
    const dateElement     = document.getElementById('current-date');
    const greetingElement = document.querySelector('.greeting-title');
    const today           = new Date();
    const hours           = today.getHours();
    let greeting = 'Good morning!';
    if (hours >= 12 && hours < 17) greeting = 'Good afternoon!';
    else if (hours >= 17)          greeting = 'Good evening!';
    greetingElement.textContent = greeting;
    dateElement.textContent = today.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

function updateAdherenceRate() {
    const today     = new Date().toISOString().split('T')[0];
    const taken     = getTakenForDate(today);
    const total     = appData.medications.length;
    if (total === 0) { setAdherenceRate(0); return; }
    setAdherenceRate(Math.round((taken.length / total) * 100));
}

function setAdherenceRate(rate) {
    document.getElementById('adherence-percent').textContent     = rate + '%';
    document.getElementById('adherence-circle-text').textContent = rate + '%';
    document.getElementById('progress-fill').style.width         = rate + '%';
}

function loadMedications() {
    const el = document.getElementById('medications-list');
    el.innerHTML = '';
    appData.medications.forEach(function(med) { el.appendChild(createMedicationCard(med)); });
}

function createMedicationCard(med) {
    const card     = document.createElement('div');
    card.className = 'medication-card';
    card.id        = 'med-' + med.id;
    const taken    = isTakenToday(med.id);
    card.innerHTML =
        '<div class="medication-info">' +
            '<div class="medication-icon">' + med.name.charAt(0) + '</div>' +
            '<div class="medication-details">' +
                '<span class="medication-name">' + med.name + '</span>' +
                '<span class="medication-dosage">' + med.dose + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="medication-time">' +
            '<span class="medication-time-text">' + formatTime(med.time) + '</span>' +
            '<p class="medication-frequency">' + med.frequency + '</p>' +
            '<button class="' + (taken ? 'btn-taken taken' : 'btn-taken') + '" onclick="markAsTaken(' + med.id + ')">' + (taken ? 'Taken' : 'Mark as Taken') + '</button>' +
        '</div>';
    return card;
}

function formatTime(time) {
    const parts   = time.split(':');
    let hours     = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm    = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return hours + ':' + minutes + ' ' + ampm;
}

async function markAsTaken(id) {
    if (!isTakenToday(id)) await recordTaken(id);
    loadMedications();
    updateAdherenceRate();
    const hp = document.getElementById('patient-history');
    if (hp && !hp.classList.contains('hidden')) loadHistoryPage();
}

// ── Patient Pages ─────────────────────────────────────────────────────────────

function showPatientPage(pageName) {
    ['patient-dashboard','patient-medications','patient-history','patient-reminders'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    if      (pageName === 'dashboard')   document.getElementById('patient-dashboard').classList.remove('hidden');
    else if (pageName === 'medications') { document.getElementById('patient-medications').classList.remove('hidden'); loadAllMedications(); }
    else if (pageName === 'history')     { const el = document.getElementById('patient-history');   if (el) { el.classList.remove('hidden'); loadHistoryPage(); } }
    else if (pageName === 'reminders')   { const el = document.getElementById('patient-reminders'); if (el) { el.classList.remove('hidden'); loadRemindersPage(); } }

    document.querySelectorAll('#bottom-nav .nav-item').forEach(function(item) {
        item.classList.toggle('active', item.dataset.page === pageName);
    });
}

// ── Medications Page ──────────────────────────────────────────────────────────

function loadAllMedications() {
    const el = document.getElementById('all-medications-list');
    el.innerHTML = '';
    appData.medications.forEach(function(med) { el.appendChild(createFullMedicationCard(med)); });
}

function createFullMedicationCard(med) {
    const card = document.createElement('div');
    card.className = 'medication-card-full';
    card.innerHTML =
        '<div class="medication-card-header">' +
            '<div class="medication-info">' +
                '<div class="medication-icon">' + med.name.charAt(0) + '</div>' +
                '<div class="medication-details">' +
                    '<span class="medication-name">' + med.name + '</span>' +
                    '<span class="medication-dosage">' + med.dose + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="medication-card-actions">' +
                '<button class="btn-edit" onclick="editMedication(' + med.id + ')">Edit</button>' +
                '<button class="btn-delete" onclick="deleteMedication(' + med.id + ')">Delete</button>' +
            '</div>' +
        '</div>' +
        '<div class="medication-card-details">' +
            '<div class="detail-item"><span class="detail-label">Time</span><span class="detail-value">' + formatTime(med.time) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Frequency</span><span class="detail-value">' + med.frequency + '</span></div>' +
        '</div>';
    return card;
}

async function deleteMedication(id) {
    await apiDeleteMedication(id);
    appData.medications = appData.medications.filter(function(m) { return m.id !== id; });
    loadAllMedications();
}

function editMedication(id) {
    const med = appData.medications.find(function(m) { return m.id === id; });
    if (!med) return;
    editingMedId = id;
    document.getElementById('med-name').value      = med.name;
    document.getElementById('med-dose').value      = med.dose;
    document.getElementById('med-frequency').value = med.frequency;
    document.getElementById('med-time').value      = med.time.substring(0,5);
    document.getElementById('add-med-modal').classList.remove('hidden');
}

var editingMedId = null;

document.getElementById('btn-add-med').addEventListener('click', function() {
    editingMedId = null;
    document.getElementById('add-med-form').reset();
    document.getElementById('add-med-modal').classList.remove('hidden');
});

document.getElementById('cancel-modal').addEventListener('click', function() {
    document.getElementById('add-med-modal').classList.add('hidden');
});

document.getElementById('add-med-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name      = document.getElementById('med-name').value;
    const dose      = document.getElementById('med-dose').value;
    const frequency = document.getElementById('med-frequency').value;
    const time      = document.getElementById('med-time').value;

    if (editingMedId !== null) {
        await apiUpdateMedication(editingMedId, name, dose, frequency, time + ':00');
        const idx = appData.medications.findIndex(function(m) { return m.id === editingMedId; });
        appData.medications[idx] = { id: editingMedId, name, dose, frequency, time: time + ':00' };
        editingMedId = null;
    } else {
        const result = await apiAddMedication(appData.patientId, name, dose, frequency, time + ':00');
        appData.medications.push({ id: result.id, name, dose, frequency, time: time + ':00' });
    }

    document.getElementById('add-med-modal').classList.add('hidden');
    document.getElementById('add-med-form').reset();
    loadAllMedications();
});

document.getElementById('bottom-nav').addEventListener('click', function(e) {
    const item = e.target.closest('.nav-item');
    if (item) showPatientPage(item.dataset.page);
});

// ── History Page ──────────────────────────────────────────────────────────────

let currentWeekStart = getWeekStart(new Date());

function getWeekStart(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0,0,0,0);
    return d;
}

function formatShortDate(date) {
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()] + ' ' + date.getDate();
}

function formatDateStr(date) {
    return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
}

function loadHistoryPage() { updateWeekDisplay(); renderHistoryTable(); }

function updateWeekDisplay() {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const adherence = calculateAdherence(currentWeekStart, weekEnd);
    const wd = document.getElementById('week-dates');
    const wa = document.getElementById('week-adherence');
    const hc = document.getElementById('history-adherence-circle');
    if (wd) wd.textContent = formatShortDate(currentWeekStart) + ' - ' + formatShortDate(weekEnd) + ', ' + weekEnd.getFullYear();
    if (wa) wa.textContent = adherence + '% Adherence';
    if (hc) hc.textContent = adherence + '%';
}

function renderHistoryTable() {
    const table = document.getElementById('history-table');
    if (!table) return;
    const today = new Date(); today.setHours(0,0,0,0);
    const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    let html = '<thead><tr><th>Medication</th>';
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart); d.setDate(d.getDate() + i);
        html += '<th' + (d.getTime() === today.getTime() ? ' class="today"' : '') + '><div>' + days[i] + '</div><div class="day-date">' + formatShortDate(d) + '</div></th>';
    }
    html += '</tr></thead><tbody>';

    if (!appData.medications.length) {
        html += '<tr><td colspan="8" class="empty-message">No medications to display</td></tr>';
    } else {
        appData.medications.forEach(function(med) {
            html += '<tr><td><div class="med-cell-name">' + med.name + '</div><div class="med-cell-dosage">' + med.dose + '</div></td>';
            for (let i = 0; i < 7; i++) {
                const d      = new Date(currentWeekStart); d.setDate(d.getDate() + i);
                const taken  = getTakenForDate(formatDateStr(d)).some(function(t) { return t.visaId === med.id; });
                let cls = 'scheduled', icon = '';
                if      (d > today)  { cls = 'scheduled'; }
                else if (taken)      { cls = 'taken';  icon = '✓'; }
                else if (d < today)  { cls = 'missed'; icon = '✗'; }
                html += '<td><span class="status-icon ' + cls + '">' + icon + '</span></td>';
            }
            html += '</tr>';
        });
    }
    table.innerHTML = html + '</tbody>';
}

document.addEventListener('click', function(e) {
    if      (e.target.id === 'prev-week')        { currentWeekStart.setDate(currentWeekStart.getDate()-7); loadHistoryPage(); }
    else if (e.target.id === 'next-week')        { const n = new Date(currentWeekStart); n.setDate(n.getDate()+7); if (n <= new Date()) { currentWeekStart = n; loadHistoryPage(); } }
    else if (e.target.id === 'current-week-btn') { currentWeekStart = getWeekStart(new Date()); loadHistoryPage(); }
});

// ── Reminders Page ────────────────────────────────────────────────────────────

function loadRemindersPage() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('todays-doses').textContent = appData.medications.length;
    document.getElementById('doses-taken').textContent  = getTakenForDate(today).length;

    const list = document.getElementById('reminders-list');
    list.innerHTML = '';
    appData.medications.forEach(function(med) {
        list.innerHTML += '<div class="reminder-card"><div class="reminder-info"><div class="reminder-icon">' + med.name.charAt(0) + '</div><div class="reminder-details"><span class="reminder-name">' + med.name + '</span><span class="reminder-dose">' + med.dose + '</span></div></div><span class="reminder-time">' + formatTime(med.time) + '</span></div>';
    });

    const apts = document.getElementById('appointments-list');
    apts.innerHTML = '';
    appData.appointments.forEach(function(apt) {
        apts.innerHTML += '<div class="reminder-card"><div class="reminder-info"><div class="reminder-icon">📅</div><div class="reminder-details"><span class="reminder-name">' + apt.title + '</span><span class="reminder-dose">' + (apt.doctor_name || '') + '</span></div></div><span class="reminder-time">' + apt.date + '</span></div>';
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//  DOCTOR VIEW
// ══════════════════════════════════════════════════════════════════════════════

function showDoctorPage(pageName) {
    document.getElementById('desktop-content').innerHTML = '';
    document.querySelectorAll('#doctor-nav .sidebar-item').forEach(function(item) {
        item.classList.toggle('active', item.dataset.page === pageName);
    });
    if      (pageName === 'dashboard')     renderDoctorDashboard();
    else if (pageName === 'patients')      renderDoctorPatients();
    else if (pageName === 'prescriptions') renderDoctorPrescriptions();
    else if (pageName === 'reports')       renderDoctorReports();
    else if (pageName === 'messages')      renderDoctorMessages();
    else if (pageName === 'settings')      renderDoctorSettings();
}

document.getElementById('doctor-nav').addEventListener('click', function(e) {
    const item = e.target.closest('.sidebar-item');
    if (item) showDoctorPage(item.dataset.page);
});

function adherenceColor(pct) {
    if (pct >= 80) return 'var(--accent)';
    if (pct >= 60) return '#f59e0b';
    return 'var(--destructive)';
}

function statusBadge(status) {
    const map = { 'stable':['badge-stable','Stable'], 'at-risk':['badge-warning','At Risk'], 'critical':['badge-critical','Critical'], 'active':['badge-stable','Active'], 'refill-due':['badge-warning','Refill Due'], 'inactive':['badge-muted','Inactive'] };
    const [cls, label] = map[status] || ['badge-muted', status];
    return '<span class="badge ' + cls + '">' + label + '</span>';
}

function avatarEl(initials, size) {
    size = size || 40;
    return '<div class="doc-avatar" style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size*0.38) + 'px">' + initials + '</div>';
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

async function renderDoctorDashboard() {
    const user    = getUser();
    const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const patients = await apiGetPatients().catch(() => []);

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><div>' +
                '<h1 class="doc-title">Good morning, ' + user.name + ' ' + user.surname + '!</h1>' +
                '<p class="doc-subtitle">' + dateStr + '</p>' +
            '</div></div>' +
            '<div class="kpi-grid">' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#e0f2f7">👥</div><div><p class="kpi-label">Total Patients</p><p class="kpi-value">' + patients.length + '</p></div></div>' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#d1fae5">💊</div><div><p class="kpi-label">Total Medications</p><p class="kpi-value">' + patients.reduce(function(s,p){ return s + (p.medications||[]).length; }, 0) + '</p></div></div>' +
            '</div>' +
            '<div class="doc-card">' +
                '<h2 class="doc-card-title">👥 Your Patients</h2>' +
                (patients.length === 0
                    ? '<p class="empty-msg">No patients assigned yet.</p>'
                    : '<table class="doc-table"><thead><tr><th>Patient</th><th>Condition</th><th>Medications</th><th></th></tr></thead><tbody>' +
                      patients.map(function(p) {
                          return '<tr class="patient-row" onclick="viewPatient(' + p.id + ')">' +
                              '<td><div class="patient-name-cell">' + avatarEl(p.name[0]+p.surname[0], 36) + '<span class="pname">' + p.name + ' ' + p.surname + '</span></div></td>' +
                              '<td>' + (p.condition || '—') + '</td>' +
                              '<td>' + (p.medications||[]).length + ' meds</td>' +
                              '<td><button class="btn-sm" onclick="event.stopPropagation();viewPatient(' + p.id + ')">View</button></td>' +
                          '</tr>';
                      }).join('') +
                      '</tbody></table>'
                ) +
            '</div>' +
        '</div>';
}

// ── PATIENTS ──────────────────────────────────────────────────────────────────

async function renderDoctorPatients() {
    document.getElementById('desktop-content').innerHTML = '<div class="doc-page"><p class="empty-msg">Loading...</p></div>';
    const patients = await apiGetPatients().catch(() => []);

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Patients</h1></div>' +
            '<div class="doc-card" style="padding:0;overflow:hidden">' +
                '<table class="doc-table"><thead><tr><th>Patient</th><th>Condition</th><th>Email</th><th>Medications</th><th></th></tr></thead><tbody>' +
                patients.map(function(p) {
                    return '<tr class="patient-row" onclick="viewPatient(' + p.id + ')">' +
                        '<td><div class="patient-name-cell">' + avatarEl(p.name[0]+p.surname[0], 36) + '<span class="pname">' + p.name + ' ' + p.surname + '</span></div></td>' +
                        '<td>' + (p.condition || '—') + '</td>' +
                        '<td>' + p.email + '</td>' +
                        '<td>' + (p.medications||[]).length + ' meds</td>' +
                        '<td><button class="btn-sm" onclick="event.stopPropagation();viewPatient(' + p.id + ')">View</button></td>' +
                    '</tr>';
                }).join('') +
                '</tbody></table>' +
            '</div>' +
        '</div>';
}

async function viewPatient(id) {
    document.getElementById('desktop-content').innerHTML = '<div class="doc-page"><p class="empty-msg">Loading...</p></div>';
    const p   = await apiGetPatient(id);
    const rxs = await apiGetPrescriptions(id).catch(() => []);

    const medsHtml = (p.medications||[]).map(function(m) {
        return '<div class="rx-row"><div class="rx-icon">' + m.name.charAt(0) + '</div><div class="rx-info"><span class="rx-name">' + m.name + ' <strong>' + m.dose + '</strong></span><span class="rx-freq">' + m.frequency + ' at ' + formatTime(m.time) + '</span></div></div>';
    }).join('') || '<p class="empty-msg">No medications.</p>';

    const rxHtml = rxs.map(function(rx) {
        return '<div class="rx-row"><div class="rx-icon">' + rx.medication.charAt(0) + '</div><div class="rx-info"><span class="rx-name">' + rx.medication + ' <strong>' + rx.dose + '</strong></span><span class="rx-freq">' + rx.frequency + ' · Refill: ' + rx.refill_date + '</span></div>' + statusBadge(rx.status) + '</div>';
    }).join('') || '<p class="empty-msg">No prescriptions.</p>';

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><button class="btn-back" onclick="renderDoctorPatients()">← Back to Patients</button></div>' +
            '<div class="doc-card patient-detail-header">' + avatarEl(p.name[0]+p.surname[0], 60) +
                '<div class="pdh-info"><h2 class="doc-title" style="margin:0">' + p.name + ' ' + p.surname + '</h2><p class="doc-subtitle">' + p.email + '</p><p class="doc-subtitle">' + (p.condition||'No condition listed') + '</p></div>' +
            '</div>' +
            '<div class="dash-row">' +
                '<div class="doc-card flex-1"><h2 class="doc-card-title">💊 Medications</h2><div class="rx-list">' + medsHtml + '</div></div>' +
                '<div class="doc-card flex-1"><div class="doc-card-title-row"><h2 class="doc-card-title">📝 Prescriptions</h2><button class="btn-sm" onclick="showDoctorPage(\'prescriptions\')">Manage</button></div><div class="rx-list">' + rxHtml + '</div></div>' +
            '</div>' +
        '</div>';
}

// ── PRESCRIPTIONS ─────────────────────────────────────────────────────────────

async function renderDoctorPrescriptions() {
    document.getElementById('desktop-content').innerHTML = '<div class="doc-page"><p class="empty-msg">Loading...</p></div>';
    const patients = await apiGetPatients().catch(() => []);
    let allRx = [];
    for (const p of patients) {
        const rxs = await apiGetPrescriptions(p.id).catch(() => []);
        allRx = allRx.concat(rxs.map(function(r){ r.patientName = p.name + ' ' + p.surname; return r; }));
    }

    const refillCount  = allRx.filter(function(r){ return r.status === 'refill-due'; }).length;
    const refillBanner = refillCount > 0 ? '<div class="doc-alert alert-warning" style="margin-bottom:20px"><span class="alert-icon">⚠️</span><span class="alert-msg">' + refillCount + ' prescription(s) require renewal.</span></div>' : '';
    const patientOpts  = patients.map(function(p){ return '<option value="' + p.id + '">' + p.name + ' ' + p.surname + '</option>'; }).join('');

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Prescriptions</h1><button class="btn-primary" onclick="openNewRxModal()">+ New Prescription</button></div>' +
            refillBanner +
            '<div class="doc-card" style="padding:0;overflow:hidden"><table class="doc-table"><thead><tr><th>Patient</th><th>Medication</th><th>Dose</th><th>Frequency</th><th>Start</th><th>Refill</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
            allRx.map(function(rx){
                return '<tr><td>' + rx.patientName + '</td><td><strong>' + rx.medication + '</strong></td><td>' + rx.dose + '</td><td>' + rx.frequency + '</td><td>' + rx.start_date + '</td><td>' + rx.refill_date + '</td><td>' + statusBadge(rx.status) + '</td><td><div style="display:flex;gap:6px"><button class="btn-sm" onclick="renewPrescription(' + rx.id + ')">Renew</button><button class="btn-sm btn-sm-danger" onclick="stopPrescription(' + rx.id + ')">Stop</button></div></td></tr>';
            }).join('') +
            '</tbody></table></div>' +
        '</div>' +
        '<div id="rx-modal" class="modal-overlay hidden"><div class="modal" style="max-width:500px">' +
            '<h2 class="modal-title">New Prescription</h2>' +
            '<div class="form-group"><label class="form-label">Patient</label><select id="rx-patient" class="form-input">' + patientOpts + '</select></div>' +
            '<div class="form-group"><label class="form-label">Medication</label><input type="text" id="rx-med" class="form-input" placeholder="e.g. Lisinopril"></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
                '<div class="form-group"><label class="form-label">Dose</label><input type="text" id="rx-dose" class="form-input" placeholder="e.g. 10mg"></div>' +
                '<div class="form-group"><label class="form-label">Frequency</label><select id="rx-freq" class="form-input"><option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>As needed</option></select></div>' +
            '</div>' +
            '<div class="modal-buttons"><button class="btn-add" onclick="saveNewRx()">Issue Prescription</button><button class="btn-cancel" onclick="closeRxModal()">Cancel</button></div>' +
        '</div></div>';
}

function openNewRxModal() { document.getElementById('rx-modal').classList.remove('hidden'); }
function closeRxModal()   { document.getElementById('rx-modal').classList.add('hidden'); }

async function saveNewRx() {
    const patientId  = parseInt(document.getElementById('rx-patient').value);
    const medication = document.getElementById('rx-med').value.trim();
    const dose       = document.getElementById('rx-dose').value.trim();
    const frequency  = document.getElementById('rx-freq').value;
    const doctor     = getUser();
    if (!medication || !dose) { alert('Please fill in medication and dose.'); return; }
    await apiAddPrescription({ patient_id: patientId, doctor_id: doctor.id, medication, dose, frequency });
    closeRxModal();
    renderDoctorPrescriptions();
}

async function renewPrescription(id) {
    const refill = new Date(); refill.setMonth(refill.getMonth()+3);
    await apiUpdatePrescription(id, { status:'active', refill_date: refill.toISOString().split('T')[0] });
    renderDoctorPrescriptions();
}

async function stopPrescription(id) {
    if (!confirm('Stop this prescription?')) return;
    await apiDeletePrescription(id);
    renderDoctorPrescriptions();
}

// ── REPORTS ───────────────────────────────────────────────────────────────────

async function renderDoctorReports() {
    document.getElementById('desktop-content').innerHTML = '<div class="doc-page"><p class="empty-msg">Loading...</p></div>';
    const patients = await apiGetPatients().catch(() => []);
    const totalMeds = patients.reduce(function(s,p){ return s + (p.medications||[]).length; }, 0);

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Reports</h1><button class="btn-primary">Export PDF</button></div>' +
            '<div class="kpi-grid">' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#e0f2f7">👥</div><div><p class="kpi-label">Total Patients</p><p class="kpi-value">' + patients.length + '</p></div></div>' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#d1fae5">💊</div><div><p class="kpi-label">Total Medications</p><p class="kpi-value">' + totalMeds + '</p></div></div>' +
            '</div>' +
            '<div class="doc-card" style="padding:0;overflow:hidden">' +
                '<div style="padding:16px 20px 0"><h2 class="doc-card-title">Patient Breakdown</h2></div>' +
                '<table class="doc-table"><thead><tr><th>Patient</th><th>Condition</th><th>Medications</th><th>Email</th></tr></thead><tbody>' +
                patients.map(function(p){
                    return '<tr><td><div class="patient-name-cell">' + avatarEl(p.name[0]+p.surname[0], 32) + '<span class="pname">' + p.name + ' ' + p.surname + '</span></div></td><td>' + (p.condition||'—') + '</td><td>' + (p.medications||[]).length + '</td><td>' + p.email + '</td></tr>';
                }).join('') +
                '</tbody></table>' +
            '</div>' +
        '</div>';
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

let activeReceiverId = null;

async function renderDoctorMessages(receiverId) {
    const threads = await apiGetThreads().catch(() => []);
    const userId  = getUser().id;

    const threadMap = {};
    threads.forEach(function(m) {
        const otherId   = m.sender_id === userId ? m.receiver_id : m.sender_id;
        const otherName = m.sender_id === userId
            ? (m.receiver_name + ' ' + m.receiver_surname)
            : (m.sender_name  + ' ' + m.sender_surname);
        if (!threadMap[otherId]) threadMap[otherId] = { id: otherId, name: otherName, messages: [], unread: false };
        threadMap[otherId].messages.push(m);
        if (!m.is_read && m.sender_id !== userId) threadMap[otherId].unread = true;
    });

    if (!receiverId) {
        const keys = Object.keys(threadMap);
        receiverId = keys.length ? parseInt(keys[0]) : null;
    }
    activeReceiverId = receiverId;

    const listHtml = Object.values(threadMap).map(function(t) {
        const last = t.messages[t.messages.length-1];
        return '<div class="msg-thread-item ' + (t.id === receiverId ? 'active' : '') + ' ' + (t.unread ? 'unread' : '') + '" onclick="renderDoctorMessages(' + t.id + ')">' +
            avatarEl(t.name.split(' ').map(function(w){return w[0];}).join(''), 40) +
            '<div class="msg-thread-info"><div class="msg-thread-top"><span class="msg-thread-name">' + t.name + '</span></div>' +
            '<span class="msg-thread-preview">' + last.body + '</span></div>' +
            (t.unread ? '<span class="unread-dot"></span>' : '') +
        '</div>';
    }).join('') || '<p class="empty-msg" style="padding:16px">No messages yet.</p>';

    const activeThread = receiverId ? threadMap[receiverId] : null;
    const bubblesHtml  = activeThread
        ? activeThread.messages.map(function(m) {
            return '<div class="msg-bubble-wrap ' + (m.sender_id === userId ? 'bubble-right' : 'bubble-left') + '">' +
                '<div class="msg-bubble ' + (m.sender_id === userId ? 'bubble-doc' : 'bubble-patient') + '">' +
                '<p>' + m.body + '</p><span class="bubble-time">' + m.sent_at + '</span></div></div>';
          }).join('')
        : '<p class="empty-msg" style="padding:20px">Select a conversation.</p>';

    const threadHeader = activeThread
        ? '<div class="msg-chat-header">' + avatarEl(activeThread.name.split(' ').map(function(w){return w[0];}).join(''), 40) + '<div><span class="msg-chat-name">' + activeThread.name + '</span></div></div>'
        : '';

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page" style="height:calc(100vh - 120px);display:flex;flex-direction:column">' +
            '<div class="doc-page-header" style="flex-shrink:0"><h1 class="doc-title">Messages</h1></div>' +
            '<div class="msg-layout">' +
                '<div class="msg-sidebar">' +
                    '<div class="msg-search-wrap"><input class="msg-search" placeholder="🔍 Search..."></div>' +
                    '<div class="msg-thread-list">' + listHtml + '</div>' +
                '</div>' +
                '<div class="msg-chat">' +
                    threadHeader +
                    '<div class="msg-chat-body">' + bubblesHtml + '</div>' +
                    '<div class="msg-input-row"><input id="msg-input" class="msg-input" placeholder="Type a message..." onkeydown="if(event.key===\'Enter\')sendMessage()"><button class="btn-primary" onclick="sendMessage()">Send</button></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() { const b = document.querySelector('.msg-chat-body'); if (b) b.scrollTop = b.scrollHeight; }, 50);
}

async function sendMessage() {
    const input = document.getElementById('msg-input');
    const text  = input.value.trim();
    if (!text || !activeReceiverId) return;
    await apiSendMessage(getUser().id, activeReceiverId, text);
    input.value = '';
    renderDoctorMessages(activeReceiverId);
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

function renderDoctorSettings() {
    const user = getUser();
    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Settings</h1></div>' +
            '<div class="doc-card">' +
                '<h2 class="doc-card-title">👤 Profile</h2>' +
                '<div class="settings-profile">' + avatarEl(user.name[0]+user.surname[0], 64) +
                    '<div><p style="font-weight:600;font-size:18px">' + user.name + ' ' + user.surname + '</p><p style="color:var(--muted-foreground)">Doctor</p></div>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px">' +
                    '<div class="form-group"><label class="form-label">First Name</label><input class="form-input" value="' + user.name + '"></div>' +
                    '<div class="form-group"><label class="form-label">Last Name</label><input class="form-input" value="' + user.surname + '"></div>' +
                '</div>' +
                '<button class="btn-primary" style="margin-top:8px">Save Profile</button>' +
            '</div>' +
            '<div class="doc-card">' +
                '<h2 class="doc-card-title">🔔 Notifications</h2>' +
                '<div class="settings-list">' +
                [['Low Adherence Alerts','Alert when a patient drops below 70%',true],
                 ['Missed Dose Alerts','Alert when patient misses 2+ doses',true],
                 ['Refill Reminders','Remind when prescriptions are due',true],
                 ['New Patient Messages','Notify on incoming messages',true],
                 ['Weekly Summary Report','Email summary every Monday',false]
                ].map(function(s){ return '<div class="setting-item"><div class="setting-info"><p class="setting-label">' + s[0] + '</p><p class="setting-desc">' + s[1] + '</p></div><label class="toggle"><input type="checkbox"' + (s[2]?' checked':'') + '><span class="toggle-slider"></span></label></div>'; }).join('') +
                '</div>' +
            '</div>' +
            '<div class="doc-card">' +
                '<h2 class="doc-card-title">🔒 Security</h2>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
                    '<div class="form-group"><label class="form-label">Current Password</label><input class="form-input" type="password" placeholder="••••••••"></div><div></div>' +
                    '<div class="form-group"><label class="form-label">New Password</label><input class="form-input" type="password" placeholder="••••••••"></div>' +
                    '<div class="form-group"><label class="form-label">Confirm Password</label><input class="form-input" type="password" placeholder="••••••••"></div>' +
                '</div>' +
                '<button class="btn-primary" style="margin-top:8px">Update Password</button>' +
            '</div>' +
        '</div>';
}

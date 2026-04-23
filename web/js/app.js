// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════

async function handleLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    errorEl.classList.add('hidden');
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
    errorEl.classList.add('hidden');
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
    const loginScreen = document.getElementById('login-screen');

    if (user && getToken()) {
        if (loginScreen) loginScreen.classList.add('hidden');
        switchLayout(user.role);
        await initAppData();
    }
});

// ══════════════════════════════════════════════════════════════════════════════
//  LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

function switchLayout(role) {
    const mobile  = document.getElementById('mobile-layout');
    const desktop = document.getElementById('desktop-layout');
    const docNav  = document.getElementById('doctor-nav');
    const admNav  = document.getElementById('admin-nav');

    if (role === 'patient') {
        mobile.classList.remove('hidden');
        desktop.classList.add('hidden');
    } else if (role === 'doctor') {
        mobile.classList.add('hidden');
        desktop.classList.remove('hidden');
        if (docNav) docNav.classList.remove('hidden');
        if (admNav) admNav.classList.add('hidden');
    } else if (role === 'admin') {
        mobile.classList.add('hidden');
        desktop.classList.remove('hidden');
        if (docNav) docNav.classList.add('hidden');
        if (admNav) admNav.classList.remove('hidden');
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  PATIENT — SHARED UTILS
// ══════════════════════════════════════════════════════════════════════════════

function formatTime(time) {
    const parts   = time.split(':');
    let hours     = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm    = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return hours + ':' + minutes + ' ' + ampm;
}

function formatDateStr(date) {
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
}

function showPatientPage(pageName) {
    ['patient-dashboard','patient-medications','patient-history','patient-reminders','patient-messages','patient-settings']
        .forEach(function(id) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });

    const target = document.getElementById('patient-' + pageName);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('#bottom-nav .nav-item').forEach(function(item) {
        item.classList.toggle('active', item.dataset.page === pageName);
    });

    if      (pageName === 'dashboard')   loadPatientDashboard();
    else if (pageName === 'medications') loadAllMedications();
    else if (pageName === 'history')     loadHistoryPage();
    else if (pageName === 'reminders')   loadRemindersPage();
    else if (pageName === 'messages')    loadPatientMessages();
    else if (pageName === 'settings')    loadPatientSettings();
}

document.getElementById('bottom-nav').addEventListener('click', function(e) {
    const item = e.target.closest('.nav-item');
    if (item) showPatientPage(item.dataset.page);
});

// ══════════════════════════════════════════════════════════════════════════════
//  PATIENT — DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

function loadPatientDashboard() {
    setCurrentDate();
    updateAdherenceRate();
    loadMedications();
}

function setCurrentDate() {
    const dateEl     = document.getElementById('current-date');
    const greetingEl = document.querySelector('.greeting-title');
    const hours      = new Date().getHours();
    let greeting = 'Good morning!';
    if (hours >= 12 && hours < 17) greeting = 'Good afternoon!';
    else if (hours >= 17)          greeting = 'Good evening!';
    if (greetingEl) greetingEl.textContent = greeting;
    if (dateEl)     dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

function updateAdherenceRate() {
    const today = new Date().toISOString().split('T')[0];
    const total = appData.medications.length;
    const taken = getTakenForDate(today).length;
    const rate  = total === 0 ? 0 : Math.round((taken / total) * 100);
    const pctEl  = document.getElementById('adherence-percent');
    const circEl = document.getElementById('adherence-circle-text');
    const barEl  = document.getElementById('progress-fill');
    if (pctEl)  pctEl.textContent  = rate + '%';
    if (circEl) circEl.textContent = rate + '%';
    if (barEl)  barEl.style.width  = rate + '%';
}

function loadMedications() {
    console.log('appData.medications:', appData.medications);
    console.log('el:', document.getElementById('medications-list'));
    const el = document.getElementById('medications-list');
    if (!el) return;
    el.innerHTML = '';
    if (appData.medications.length === 0) {
        el.innerHTML = '<p style="color:var(--muted-foreground);text-align:center;padding:20px">No medications added yet.</p>';
        return;
    }
    appData.medications.forEach(function(med) { el.appendChild(createMedicationCard(med)); });
}

function createMedicationCard(med) {
    const card     = document.createElement('div');
    card.className = 'medication-card';
    card.id        = 'med-' + med.id;
    const taken    = isTakenToday(med.id);
    card.innerHTML =
        '<div class="medication-info">' +
            '<div class="medication-icon">' + med.name.charAt(0).toUpperCase() + '</div>' +
            '<div class="medication-details">' +
                '<span class="medication-name">' + med.name + '</span>' +
                '<span class="medication-dosage">' + med.dose + ' · ' + med.frequency + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="medication-time">' +
            '<span class="medication-time-text">' + formatTime(med.time) + '</span>' +
            '<button class="' + (taken ? 'btn-taken taken' : 'btn-taken') + '" onclick="markAsTaken(' + med.id + ')">' +
                (taken ? '✓ Taken' : 'Mark as Taken') +
            '</button>' +
        '</div>';
    return card;
}

async function markAsTaken(id) {
    if (!isTakenToday(id)) await recordTaken(id);
    loadMedications();
    updateAdherenceRate();
    const hp = document.getElementById('patient-history');
    if (hp && !hp.classList.contains('hidden')) renderHistoryTable();
}

// ══════════════════════════════════════════════════════════════════════════════
//  PATIENT — MEDICATIONS PAGE
// ══════════════════════════════════════════════════════════════════════════════

function loadAllMedications() {
    const el = document.getElementById('all-medications-list');
    if (!el) return;
    el.innerHTML = '';
    if (appData.medications.length === 0) {
        el.innerHTML = '<p style="color:var(--muted-foreground);text-align:center;padding:20px">No medications yet. Tap + Add to get started.</p>';
        return;
    }
    appData.medications.forEach(function(med) { el.appendChild(createFullMedicationCard(med)); });
}

function createFullMedicationCard(med) {
    const card = document.createElement('div');
    card.className = 'medication-card-full';
    card.innerHTML =
        '<div class="medication-card-header">' +
            '<div class="medication-info">' +
                '<div class="medication-icon">' + med.name.charAt(0).toUpperCase() + '</div>' +
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
    if (!confirm('Delete this medication?')) return;
    await apiDeleteMedication(id);
    appData.medications = appData.medications.filter(function(m) { return m.id !== id; });
    loadAllMedications();
    loadMedications();
    updateAdherenceRate();
}

function editMedication(id) {
    const med = appData.medications.find(function(m) { return m.id === id; });
    if (!med) return;
    editingMedId = id;
    document.getElementById('med-name').value      = med.name;
    document.getElementById('med-dose').value      = med.dose;
    document.getElementById('med-frequency').value = med.frequency;
    document.getElementById('med-time').value      = med.time.substring(0, 5);
    document.getElementById('modal-title').textContent  = 'Edit Medication';
    document.getElementById('modal-submit').textContent = 'Save Changes';
    document.getElementById('add-med-modal').classList.remove('hidden');
}

var editingMedId = null;

document.getElementById('btn-add-med').addEventListener('click', function() {
    editingMedId = null;
    document.getElementById('add-med-form').reset();
    document.getElementById('modal-title').textContent  = 'Add Medication';
    document.getElementById('modal-submit').textContent = 'Add Medication';
    document.getElementById('add-med-modal').classList.remove('hidden');
});

document.getElementById('cancel-modal').addEventListener('click', function() {
    document.getElementById('add-med-modal').classList.add('hidden');
    editingMedId = null;
});

document.getElementById('add-med-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name      = document.getElementById('med-name').value.trim();
    const dose      = document.getElementById('med-dose').value.trim();
    const frequency = document.getElementById('med-frequency').value;
    const time      = document.getElementById('med-time').value;

    if (editingMedId !== null) {
        await apiUpdateMedication(editingMedId, name, dose, frequency, time + ':00');
        const idx = appData.medications.findIndex(function(m) { return m.id === editingMedId; });
        if (idx !== -1) appData.medications[idx] = { id: editingMedId, name, dose, frequency, time: time + ':00' };
        editingMedId = null;
    } else {
        const result = await apiAddMedication(appData.patientId, name, dose, frequency, time + ':00');
        appData.medications.push({ id: result.id, name, dose, frequency, time: time + ':00' });
    }

    document.getElementById('add-med-modal').classList.add('hidden');
    document.getElementById('add-med-form').reset();
    loadAllMedications();
    loadMedications();
    updateAdherenceRate();
});

// ══════════════════════════════════════════════════════════════════════════════
//  PATIENT — HISTORY PAGE
// ══════════════════════════════════════════════════════════════════════════════

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

function loadHistoryPage() {
    updateWeekDisplay();
    renderHistoryTable();
}

function updateWeekDisplay() {
    const weekEnd   = new Date(currentWeekStart);
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
        html += '<th' + (d.getTime() === today.getTime() ? ' class="today"' : '') + '>' +
            '<div>' + days[i] + '</div><div class="day-date">' + formatShortDate(d) + '</div></th>';
    }
    html += '</tr></thead><tbody>';

    if (!appData.medications.length) {
        html += '<tr><td colspan="8" class="empty-message">No medications to display</td></tr>';
    } else {
        appData.medications.forEach(function(med) {
            html += '<tr><td><div class="med-cell-name">' + med.name + '</div><div class="med-cell-dosage">' + med.dose + '</div></td>';
            for (let i = 0; i < 7; i++) {
                const d     = new Date(currentWeekStart); d.setDate(d.getDate() + i);
                const taken = getTakenForDate(formatDateStr(d)).some(function(t) { return t.visaId === med.id; });
                let cls = 'scheduled', icon = '';
                if      (d > today) { cls = 'scheduled'; }
                else if (taken)     { cls = 'taken';  icon = '✓'; }
                else                { cls = 'missed'; icon = '✗'; }
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

// ══════════════════════════════════════════════════════════════════════════════
//  PATIENT — REMINDERS PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function loadRemindersPage() {
    const today = new Date().toISOString().split('T')[0];
    const el_td = document.getElementById('todays-doses');
    const el_tk = document.getElementById('doses-taken');
    if (el_td) el_td.textContent = appData.medications.length;
    if (el_tk) el_tk.textContent = getTakenForDate(today).length;

    // todays medication schedule
    const list = document.getElementById('reminders-list');
    if (list) {
        list.innerHTML = '';
        if (!appData.medications.length) {
            list.innerHTML = '<p style="color:var(--muted-foreground);text-align:center;padding:16px">No medications scheduled.</p>';
        } else {
            appData.medications.forEach(function(med) {
                const taken = isTakenToday(med.id);
                list.innerHTML +=
                    '<div class="reminder-card">' +
                        '<div class="reminder-info">' +
                            '<div class="reminder-icon' + (taken ? ' taken' : '') + '">' + med.name.charAt(0).toUpperCase() + '</div>' +
                            '<div class="reminder-details">' +
                                '<span class="reminder-name">' + med.name + '</span>' +
                                '<span class="reminder-dose">' + med.dose + ' · ' + med.frequency + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
                            '<span class="reminder-time">' + formatTime(med.time) + '</span>' +
                            (taken ? '<span style="font-size:11px;color:var(--accent);font-weight:600">✓ Taken</span>' : '') +
                        '</div>' +
                    '</div>';
            });
        }
    }

    // perscriptions
    const rxList = document.getElementById('prescriptions-list');
    if (rxList && appData.patientId) {
        rxList.innerHTML = '<p style="color:var(--muted-foreground);font-size:13px;padding:8px 0">Loading...</p>';
        try {
            const rxs = await apiGetPrescriptions(appData.patientId);
            if (!rxs.length) {
                rxList.innerHTML = '<p style="color:var(--muted-foreground);text-align:center;padding:16px">No prescriptions on file.</p>';
            } else {
                rxList.innerHTML = '';
                rxs.forEach(function(rx) {
                    const isRefillDue = rx.status === 'refill-due';
                    const statusColor = rx.status === 'active' ? 'var(--accent)' : isRefillDue ? '#f59e0b' : 'var(--muted-foreground)';
                    const statusLabel = rx.status === 'active' ? 'Active' : isRefillDue ? 'Refill Due' : rx.status;
                    rxList.innerHTML +=
                        '<div class="reminder-card">' +
                            '<div class="reminder-info">' +
                                '<div class="reminder-icon" style="background:var(--primary);color:#fff">' + rx.medication.charAt(0).toUpperCase() + '</div>' +
                                '<div class="reminder-details">' +
                                    '<span class="reminder-name">' + rx.medication + ' <strong>' + rx.dose + '</strong></span>' +
                                    '<span class="reminder-dose">' + rx.frequency + (rx.doctor_name ? ' · Dr. ' + rx.doctor_name + ' ' + rx.doctor_surname : '') + '</span>' +
                                    (rx.refill_date ? '<span style="font-size:11px;color:var(--muted-foreground)">Refill: ' + rx.refill_date + '</span>' : '') +
                                '</div>' +
                            '</div>' +
                            '<span style="font-size:11px;font-weight:600;color:' + statusColor + '">' + statusLabel + '</span>' +
                        '</div>';
                });
            }
        } catch(err) {
            rxList.innerHTML = '<p style="color:var(--muted-foreground);text-align:center;padding:16px">Could not load prescriptions.</p>';
        }
    }

    // Appointments
    const apts = document.getElementById('appointments-list');
    if (apts) {
        apts.innerHTML = '';
        if (!appData.appointments.length) {
            apts.innerHTML = '<p style="color:var(--muted-foreground);text-align:center;padding:16px">No upcoming appointments.</p>';
        } else {
            appData.appointments.forEach(function(apt) {
                const aptDate    = new Date(apt.date + 'T' + (apt.time || '00:00:00'));
                const isUpcoming = aptDate >= new Date();
                apts.innerHTML +=
                    '<div class="reminder-card">' +
                        '<div class="reminder-info">' +
                            '<div class="reminder-icon">📅</div>' +
                            '<div class="reminder-details">' +
                                '<span class="reminder-name">' + apt.title + '</span>' +
                                '<span class="reminder-dose">' + apt.date + (apt.time ? ' at ' + formatTime(apt.time) : '') + (apt.doctor_name ? ' · Dr. ' + apt.doctor_name : '') + '</span>' +
                            '</div>' +
                        '</div>' +
                        (isUpcoming ? '<span style="font-size:11px;color:var(--primary);font-weight:600">Upcoming</span>' : '') +
                    '</div>';
            });
        }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  PATIENT — MESSAGES PAGE
// ══════════════════════════════════════════════════════════════════════════════

let patientActiveReceiver = null;

async function loadPatientMessages() {
    const container = document.getElementById('patient-messages');
    if (!container) return;
    container.innerHTML = '<p style="padding:20px;color:var(--muted-foreground)">Loading...</p>';

    const threads = await apiGetThreads().catch(() => []);
    const userId  = getUser().id;

    const threadMap = {};
    threads.forEach(function(m) {
        const otherId   = m.sender_id === userId ? m.receiver_id   : m.sender_id;
        const otherName = m.sender_id === userId
            ? (m.receiver_name + ' ' + m.receiver_surname)
            : (m.sender_name  + ' ' + m.sender_surname);
        if (!threadMap[otherId]) threadMap[otherId] = { id: otherId, name: otherName, messages: [], unread: false };
        threadMap[otherId].messages.push(m);
        if (!m.is_read && m.sender_id !== userId) threadMap[otherId].unread = true;
    });

    const keys = Object.keys(threadMap);
    if (!patientActiveReceiver && keys.length) patientActiveReceiver = parseInt(keys[0]);

    const activeThread = patientActiveReceiver ? threadMap[patientActiveReceiver] : null;

    const listHtml = keys.length === 0
        ? '<p style="padding:16px;color:var(--muted-foreground)">No messages yet.</p>'
        : keys.map(function(k) {
            const t    = threadMap[k];
            const last = t.messages[t.messages.length - 1];
            return '<div class="msg-thread-item' + (t.id === patientActiveReceiver ? ' active' : '') + (t.unread ? ' unread' : '') + '" onclick="selectPatientThread(' + t.id + ')">' +
                '<div class="msg-thread-avatar">' + t.name.split(' ').map(function(w){return w[0];}).join('') + '</div>' +
                '<div class="msg-thread-info">' +
                    '<div class="msg-thread-top"><span class="msg-thread-name">' + t.name + '</span></div>' +
                    '<span class="msg-thread-preview">' + last.body.substring(0,50) + (last.body.length>50?'…':'') + '</span>' +
                '</div>' +
                (t.unread ? '<span class="unread-dot"></span>' : '') +
            '</div>';
          }).join('');

    const bubblesHtml = activeThread
        ? activeThread.messages.map(function(m) {
            const mine = m.sender_id === userId;
            return '<div class="msg-bubble-wrap ' + (mine ? 'bubble-right' : 'bubble-left') + '">' +
                '<div class="msg-bubble ' + (mine ? 'bubble-doc' : 'bubble-patient') + '">' +
                '<p>' + m.body + '</p>' +
                '<span class="bubble-time">' + new Date(m.sent_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) + '</span>' +
                '</div></div>';
          }).join('')
        : '<p style="padding:20px;color:var(--muted-foreground);text-align:center">Select a conversation.</p>';

    const chatHeader = activeThread
        ? '<div class="msg-chat-header">' +
            '<div class="msg-thread-avatar">' + activeThread.name.split(' ').map(function(w){return w[0];}).join('') + '</div>' +
            '<span class="msg-chat-name">' + activeThread.name + '</span>' +
          '</div>'
        : '';

    container.innerHTML =
        '<div class="msg-layout" style="height:calc(100vh - 120px)">' +
            '<div class="msg-sidebar">' +
                '<div style="padding:12px 16px;font-weight:600;border-bottom:1px solid var(--border)">Messages</div>' +
                '<div class="msg-thread-list">' + listHtml + '</div>' +
            '</div>' +
            '<div class="msg-chat">' +
                chatHeader +
                '<div class="msg-chat-body" id="patient-chat-body">' + bubblesHtml + '</div>' +
                '<div class="msg-input-row">' +
                    '<input id="patient-msg-input" class="msg-input" placeholder="Type a message..." onkeydown="if(event.key===\'Enter\')sendPatientMessage()">' +
                    '<button class="btn-primary" onclick="sendPatientMessage()">Send</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        const b = document.getElementById('patient-chat-body');
        if (b) b.scrollTop = b.scrollHeight;
    }, 50);
}

function selectPatientThread(id) {
    patientActiveReceiver = id;
    loadPatientMessages();
}

async function sendPatientMessage() {
    const input = document.getElementById('patient-msg-input');
    const text  = input ? input.value.trim() : '';
    if (!text || !patientActiveReceiver) return;
    await apiSendMessage(getUser().id, patientActiveReceiver, text);
    input.value = '';
    loadPatientMessages();
}

// ══════════════════════════════════════════════════════════════════════════════
//  PATIENT — SETTINGS PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function loadPatientSettings() {
    const container = document.getElementById('patient-settings');
    if (!container) return;
    const user = getUser();

    // Fetch full patient record for profile fields
    let patient = {};
    try { patient = await apiGetPatient(user.id); } catch(e) {}

    // Compute age from date_of_birth
    function calcAge(dob) {
        if (!dob) return '—';
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    }

    const age             = calcAge(patient.date_of_birth);
    const gender          = patient.gender          || '—';
    const allergies       = patient.allergies       || 'None reported';
    const injuries        = patient.previous_injuries || 'None reported';
    const lastVisit       = patient.last_hospital_visit
        ? new Date(patient.last_hospital_visit).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
        : '—';
    const condition       = patient.condition       || '—';

    container.innerHTML =
        '<div style="padding:16px">' +
            '<h1 class="page-title" style="margin-bottom:16px">Settings</h1>' +

            // ── Profile header card ───────────────────────────────────────────
            '<div class="card" style="margin-bottom:16px">' +
                '<h2 class="section-title">👤 Profile</h2>' +
                '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">' +
                    '<div class="medication-icon" style="width:56px;height:56px;font-size:22px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--primary);color:#fff;flex-shrink:0">' +
                        user.name.charAt(0) + user.surname.charAt(0) +
                    '</div>' +
                    '<div>' +
                        '<p style="font-weight:700;font-size:16px">' + user.name + ' ' + user.surname + '</p>' +
                        '<p style="font-size:13px;color:var(--muted-foreground)">' + user.email + '</p>' +
                        '<p style="font-size:12px;color:var(--accent);font-weight:600;margin-top:2px">Patient</p>' +
                    '</div>' +
                '</div>' +

                // ── Info grid ─────────────────────────────────────────────────
                '<div class="profile-info-grid">' +
                    '<div class="profile-info-item">' +
                        '<span class="profile-info-icon">🎂</span>' +
                        '<div><p class="profile-info-label">Age</p><p class="profile-info-value">' + age + (age !== '—' ? ' yrs' : '') + '</p></div>' +
                    '</div>' +
                    '<div class="profile-info-item">' +
                        '<span class="profile-info-icon">⚧</span>' +
                        '<div><p class="profile-info-label">Gender</p><p class="profile-info-value">' + gender + '</p></div>' +
                    '</div>' +
                    '<div class="profile-info-item">' +
                        '<span class="profile-info-icon">🩺</span>' +
                        '<div><p class="profile-info-label">Condition</p><p class="profile-info-value">' + condition + '</p></div>' +
                    '</div>' +
                    '<div class="profile-info-item">' +
                        '<span class="profile-info-icon">🏥</span>' +
                        '<div><p class="profile-info-label">Last Hospital Visit</p><p class="profile-info-value">' + lastVisit + '</p></div>' +
                    '</div>' +
                '</div>' +

                // ── Allergies ─────────────────────────────────────────────────
                '<div class="profile-detail-block profile-detail-alert">' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
                        '<span style="font-size:18px">⚠️</span>' +
                        '<p class="profile-info-label" style="margin:0;font-weight:700;color:#b45309">Allergies</p>' +
                    '</div>' +
                    '<p class="profile-detail-text">' + allergies + '</p>' +
                '</div>' +

                // ── Previous Injuries ─────────────────────────────────────────
                '<div class="profile-detail-block">' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
                        '<span style="font-size:18px">🩹</span>' +
                        '<p class="profile-info-label" style="margin:0;font-weight:700">Previous Injuries</p>' +
                    '</div>' +
                    '<p class="profile-detail-text">' + injuries + '</p>' +
                '</div>' +

                // ── Edit button ───────────────────────────────────────────────
                '<button class="btn-edit" style="margin-top:16px;width:100%;padding:10px;border-radius:var(--radius)" onclick="openEditProfileModal(' +
                    JSON.stringify({ dob: patient.date_of_birth||'', gender: patient.gender||'', allergies: patient.allergies||'', injuries: patient.previous_injuries||'', lastVisit: patient.last_hospital_visit||'' }).replace(/"/g,'&quot;') +
                ')">✏️ Edit Profile Info</button>' +
            '</div>' +

            // ── Notifications card ────────────────────────────────────────────
            '<div class="card" style="margin-bottom:16px">' +
                '<h2 class="section-title">🔔 Notifications</h2>' +
                '<div class="settings-list">' +
                    '<div class="setting-item"><div class="setting-info"><p class="setting-label">Medication Reminders</p><p class="setting-desc">Get notified before each dose</p></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>' +
                    '<div class="setting-item"><div class="setting-info"><p class="setting-label">Missed Dose Alerts</p><p class="setting-desc">Alert when a dose is missed</p></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>' +
                    '<div class="setting-item"><div class="setting-info"><p class="setting-label">Appointment Reminders</p><p class="setting-desc">24h before each appointment</p></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>' +
                '</div>' +
            '</div>' +

            // ── Account card ──────────────────────────────────────────────────
            '<div class="card">' +
                '<h2 class="section-title">🔒 Account</h2>' +
                '<button class="btn-delete" style="width:100%;padding:12px;margin-top:8px" onclick="handleLogout()">Sign Out</button>' +
            '</div>' +

            // ── Edit profile modal ────────────────────────────────────────────
            '<div id="edit-profile-modal" class="modal-overlay hidden">' +
                '<div class="modal" style="max-width:400px">' +
                    '<h2 class="modal-title">Edit Profile Info</h2>' +
                    '<div class="form-group"><label class="form-label">Date of Birth</label><input type="date" id="ep-dob" class="form-input"></div>' +
                    '<div class="form-group"><label class="form-label">Gender</label>' +
                        '<select id="ep-gender" class="form-input">' +
                            '<option value="">— Select —</option>' +
                            '<option value="Male">Male</option>' +
                            '<option value="Female">Female</option>' +
                            '<option value="Non-binary">Non-binary</option>' +
                            '<option value="Prefer not to say">Prefer not to say</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="form-group"><label class="form-label">Allergies</label><textarea id="ep-allergies" class="form-input" rows="2" placeholder="e.g. Penicillin, Peanuts"></textarea></div>' +
                    '<div class="form-group"><label class="form-label">Previous Injuries</label><textarea id="ep-injuries" class="form-input" rows="2" placeholder="e.g. Broken arm 2019, Knee surgery 2021"></textarea></div>' +
                    '<div class="form-group"><label class="form-label">Last Hospital Visit</label><input type="date" id="ep-last-visit" class="form-input"></div>' +
                    '<div class="modal-buttons">' +
                        '<button class="btn-add" onclick="saveProfileInfo()">Save Changes</button>' +
                        '<button class="btn-cancel" onclick="document.getElementById(\'edit-profile-modal\').classList.add(\'hidden\')">Cancel</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

function openEditProfileModal(data) {
    document.getElementById('ep-dob').value        = data.dob       || '';
    document.getElementById('ep-gender').value     = data.gender    || '';
    document.getElementById('ep-allergies').value  = data.allergies || '';
    document.getElementById('ep-injuries').value   = data.injuries  || '';
    document.getElementById('ep-last-visit').value = data.lastVisit || '';
    document.getElementById('edit-profile-modal').classList.remove('hidden');
}

async function saveProfileInfo() {
    const user = getUser();
    await apiFetch('/patients/' + user.id, 'PUT', {
        gender:             document.getElementById('ep-gender').value,
        date_of_birth:      document.getElementById('ep-dob').value        || null,
        allergies:          document.getElementById('ep-allergies').value.trim(),
        previous_injuries:  document.getElementById('ep-injuries').value.trim(),
        last_hospital_visit: document.getElementById('ep-last-visit').value || null
    }).catch(function(){});
    document.getElementById('edit-profile-modal').classList.add('hidden');
    loadPatientSettings();
}

async function handleLogout() {
    await apiLogout().catch(function(){});
    location.reload();
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

document.getElementById('admin-nav').addEventListener('click', function(e) {
    const item = e.target.closest('.sidebar-item');
    if (item) showAdminPage(item.dataset.page);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function adherenceColor(pct) {
    if (pct >= 80) return 'var(--accent)';
    if (pct >= 60) return '#f59e0b';
    return 'var(--destructive)';
}
function statusBadge(status) {
    const map = { 'stable':['badge-stable','Stable'],'at-risk':['badge-warning','At Risk'],'critical':['badge-critical','Critical'],'active':['badge-stable','Active'],'refill-due':['badge-warning','Refill Due'],'inactive':['badge-muted','Inactive'] };
    const [cls, label] = map[status] || ['badge-muted', status];
    return '<span class="badge ' + cls + '">' + label + '</span>';
}
function avatarEl(initials, size) {
    size = size || 40;
    return '<div class="doc-avatar" style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size*0.38) + 'px">' + (initials||'?') + '</div>';
}
function loading() { return '<div class="doc-page"><p class="empty-msg" style="padding:40px;text-align:center">Loading...</p></div>'; }

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

async function renderDoctorDashboard() {
    document.getElementById('desktop-content').innerHTML = loading();
    const user     = getUser();
    const patients = await apiGetPatients().catch(() => []);
    const dateStr  = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    const totalMeds = patients.reduce(function(s,p){ return s + (p.medications||[]).length; }, 0);

    // Next upcoming appointment across all patients
    let nextApt = null;
    for (const p of patients) {
        const apts = await apiGetAppointments(p.id).catch(() => []);
        apts.forEach(function(a) {
            const d = new Date(a.date + 'T' + (a.time||'00:00:00'));
            if (d >= new Date() && (!nextApt || d < new Date(nextApt.date + 'T' + nextApt.time))) {
                nextApt = Object.assign({}, a, { patientName: p.name + ' ' + p.surname });
            }
        });
    }

    const rowsHtml = patients.slice(0,5).map(function(p) {
        return '<tr class="patient-row" onclick="showDoctorPage(\'patients\')">' +
            '<td><div class="patient-name-cell">' + avatarEl(p.name[0]+p.surname[0], 36) + '<span class="pname">' + p.name + ' ' + p.surname + '</span></div></td>' +
            '<td>' + (p.condition || '—') + '</td>' +
            '<td>' + (p.medications||[]).length + ' meds</td>' +
        '</tr>';
    }).join('');

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><div>' +
                '<h1 class="doc-title">Good morning, Dr. ' + user.surname + '!</h1>' +
                '<p class="doc-subtitle">' + dateStr + '</p>' +
            '</div></div>' +

            '<div class="kpi-grid">' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#e0f2f7">👥</div><div><p class="kpi-label">Total Patients</p><p class="kpi-value">' + patients.length + '</p></div></div>' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#d1fae5">💊</div><div><p class="kpi-label">Active Medications</p><p class="kpi-value">' + totalMeds + '</p></div></div>' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#fef3c7">📅</div><div><p class="kpi-label">Next Appointment</p><p class="kpi-value" style="font-size:16px">' + (nextApt ? nextApt.patientName + '<br><small style="font-size:12px;color:var(--muted-foreground)">' + nextApt.date + '</small>' : '—') + '</p></div></div>' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#ede9fe">📝</div><div><p class="kpi-label">Quick Actions</p><p class="kpi-value" style="font-size:13px"><button class="btn-sm" onclick="showDoctorPage(\'prescriptions\')">New Rx</button></p></div></div>' +
            '</div>' +

            '<div class="doc-card">' +
                '<div class="doc-card-title-row"><h2 class="doc-card-title">👥 Recent Patients</h2><button class="btn-sm" onclick="showDoctorPage(\'patients\')">View All →</button></div>' +
                (patients.length === 0
                    ? '<p class="empty-msg">No patients yet.</p>'
                    : '<table class="doc-table"><thead><tr><th>Patient</th><th>Condition</th><th>Medications</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>'
                ) +
            '</div>' +
        '</div>';
}

// ── PATIENTS ──────────────────────────────────────────────────────────────────

async function renderDoctorPatients() {
    document.getElementById('desktop-content').innerHTML = loading();
    const patients = await apiGetPatients().catch(() => []);

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Patients</h1></div>' +
            '<div class="doc-card" style="padding:0;overflow:hidden">' +
                '<table class="doc-table"><thead><tr><th>Patient</th><th>Condition</th><th>Email</th><th>Medications</th><th></th></tr></thead><tbody>' +
                patients.map(function(p) {
                    return '<tr class="patient-row" onclick="viewPatient(' + p.id + ')">' +
                        '<td><div class="patient-name-cell">' + avatarEl(p.name[0]+p.surname[0], 36) + '<span class="pname">' + p.name + ' ' + p.surname + '</span></div></td>' +
                        '<td>' + (p.condition||'—') + '</td>' +
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
    document.getElementById('desktop-content').innerHTML = loading();
    const p   = await apiGetPatient(id);
    const rxs = await apiGetPrescriptions(id).catch(() => []);
    const apts = await apiGetAppointments(id).catch(() => []);

    const medsHtml = (p.medications||[]).length === 0
        ? '<p class="empty-msg">No medications.</p>'
        : (p.medications||[]).map(function(m) {
            return '<div class="rx-row"><div class="rx-icon">' + m.name.charAt(0) + '</div>' +
                '<div class="rx-info"><span class="rx-name">' + m.name + ' <strong>' + m.dose + '</strong></span>' +
                '<span class="rx-freq">' + m.frequency + ' at ' + formatTime(m.time) + '</span></div></div>';
          }).join('');

    const rxHtml = rxs.length === 0
        ? '<p class="empty-msg">No prescriptions.</p>'
        : rxs.map(function(rx) {
            return '<div class="rx-row"><div class="rx-icon">' + rx.medication.charAt(0) + '</div>' +
                '<div class="rx-info"><span class="rx-name">' + rx.medication + ' <strong>' + rx.dose + '</strong></span>' +
                '<span class="rx-freq">' + rx.frequency + ' · Refill: ' + rx.refill_date + '</span></div>' +
                statusBadge(rx.status) + '</div>';
          }).join('');

    const aptsHtml = apts.length === 0
        ? '<p class="empty-msg">No appointments.</p>'
        : apts.map(function(a) {
            return '<div class="rx-row"><div class="rx-icon">📅</div>' +
                '<div class="rx-info"><span class="rx-name">' + a.title + '</span>' +
                '<span class="rx-freq">' + a.date + ' at ' + formatTime(a.time) + '</span></div></div>';
          }).join('');

    // Compute age
    function calcAgeDoc(dob) {
        if (!dob) return null;
        const birth = new Date(dob); const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    }
    const age       = calcAgeDoc(p.date_of_birth);
    const lastVisit = p.last_hospital_visit
        ? new Date(p.last_hospital_visit).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
        : '—';

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><button class="btn-back" onclick="renderDoctorPatients()">← Back to Patients</button></div>' +

            // ── Patient header ────────────────────────────────────────────────
            '<div class="doc-card patient-detail-header">' + avatarEl(p.name[0]+p.surname[0], 60) +
                '<div class="pdh-info">' +
                    '<h2 class="doc-title" style="margin:0">' + p.name + ' ' + p.surname + '</h2>' +
                    '<p class="doc-subtitle">' + p.email + '</p>' +
                    '<p class="doc-subtitle" style="margin-top:4px">🩺 ' + (p.condition||'No condition listed') + '</p>' +
                '</div>' +
                '<button class="btn-sm" style="margin-left:auto;align-self:flex-start" onclick="openMessagePatient(' + p.user_id + ', \'' + p.name + ' ' + p.surname + '\')">💬 Message</button>' +
            '</div>' +

            // ── Profile info card ─────────────────────────────────────────────
            '<div class="doc-card" style="margin-bottom:16px">' +
                '<h2 class="doc-card-title">🪪 Patient Profile</h2>' +
                '<div class="profile-info-grid" style="margin-top:12px">' +
                    '<div class="profile-info-item">' +
                        '<span class="profile-info-icon">🎂</span>' +
                        '<div><p class="profile-info-label">Age</p><p class="profile-info-value">' + (age !== null ? age + ' yrs' : '—') + '</p></div>' +
                    '</div>' +
                    '<div class="profile-info-item">' +
                        '<span class="profile-info-icon">⚧</span>' +
                        '<div><p class="profile-info-label">Gender</p><p class="profile-info-value">' + (p.gender||'—') + '</p></div>' +
                    '</div>' +
                    '<div class="profile-info-item">' +
                        '<span class="profile-info-icon">🩺</span>' +
                        '<div><p class="profile-info-label">Condition</p><p class="profile-info-value">' + (p.condition||'—') + '</p></div>' +
                    '</div>' +
                    '<div class="profile-info-item">' +
                        '<span class="profile-info-icon">🏥</span>' +
                        '<div><p class="profile-info-label">Last Hospital Visit</p><p class="profile-info-value">' + lastVisit + '</p></div>' +
                    '</div>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">' +
                    '<div class="profile-detail-block profile-detail-alert">' +
                        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span>⚠️</span><p class="profile-info-label" style="margin:0;font-weight:700;color:#b45309">Allergies</p></div>' +
                        '<p class="profile-detail-text">' + (p.allergies||'None reported') + '</p>' +
                    '</div>' +
                    '<div class="profile-detail-block">' +
                        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span>🩹</span><p class="profile-info-label" style="margin:0;font-weight:700">Previous Injuries</p></div>' +
                        '<p class="profile-detail-text">' + (p.previous_injuries||'None reported') + '</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // ── Meds & Prescriptions ──────────────────────────────────────────
            '<div class="dash-row">' +
                '<div class="doc-card flex-1"><h2 class="doc-card-title">💊 Medications</h2><div class="rx-list">' + medsHtml + '</div></div>' +
                '<div class="doc-card flex-1"><div class="doc-card-title-row"><h2 class="doc-card-title">📝 Prescriptions</h2><button class="btn-sm" onclick="showDoctorPage(\'prescriptions\')">Manage</button></div><div class="rx-list">' + rxHtml + '</div></div>' +
            '</div>' +
            '<div class="doc-card"><h2 class="doc-card-title">📅 Appointments</h2><div class="rx-list">' + aptsHtml + '</div></div>' +
        '</div>';
}

// ── PRESCRIPTIONS ─────────────────────────────────────────────────────────────

async function renderDoctorPrescriptions() {
    document.getElementById('desktop-content').innerHTML = loading();
    const patients = await apiGetPatients().catch(() => []);
    let allRx = [];
    for (const p of patients) {
        const rxs = await apiGetPrescriptions(p.id).catch(() => []);
        allRx = allRx.concat(rxs.map(function(r){ r._patientName = p.name + ' ' + p.surname; return r; }));
    }

    const refillCount  = allRx.filter(function(r){ return r.status === 'refill-due'; }).length;
    const refillBanner = refillCount > 0
        ? '<div class="doc-alert alert-warning" style="margin-bottom:20px"><span class="alert-icon">⚠️</span><span class="alert-msg">' + refillCount + ' prescription(s) require renewal.</span></div>'
        : '';
    const patientOpts = patients.map(function(p){ return '<option value="' + p.id + '">' + p.name + ' ' + p.surname + '</option>'; }).join('');

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Prescriptions</h1><button class="btn-primary" onclick="openNewRxModal()">+ New Prescription</button></div>' +
            refillBanner +
            '<div class="doc-card" style="padding:0;overflow:hidden"><table class="doc-table">' +
                '<thead><tr><th>Patient</th><th>Medication</th><th>Dose</th><th>Frequency</th><th>Start</th><th>Refill</th><th>Status</th><th>Actions</th></tr></thead>' +
                '<tbody>' + allRx.map(function(rx) {
                    return '<tr>' +
                        '<td>' + rx._patientName + '</td>' +
                        '<td><strong>' + rx.medication + '</strong></td>' +
                        '<td>' + rx.dose + '</td>' +
                        '<td>' + rx.frequency + '</td>' +
                        '<td>' + rx.start_date + '</td>' +
                        '<td>' + rx.refill_date + '</td>' +
                        '<td>' + statusBadge(rx.status) + '</td>' +
                        '<td><div style="display:flex;gap:6px"><button class="btn-sm" onclick="renewPrescription(' + rx.id + ')">Renew</button><button class="btn-sm btn-sm-danger" onclick="stopPrescription(' + rx.id + ')">Stop</button></div></td>' +
                    '</tr>';
                }).join('') + '</tbody>' +
            '</table></div>' +
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
    if (!medication || !dose) { alert('Please fill in medication and dose.'); return; }
    await apiAddPrescription({ patient_id: patientId, doctor_id: getUser().id, medication, dose, frequency });
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
    document.getElementById('desktop-content').innerHTML = loading();
    const patients  = await apiGetPatients().catch(() => []);
    const totalMeds = patients.reduce(function(s,p){ return s + (p.medications||[]).length; }, 0);

    let allRx = [];
    for (const p of patients) {
        const rxs = await apiGetPrescriptions(p.id).catch(() => []);
        allRx = allRx.concat(rxs);
    }
    const refillsDue = allRx.filter(function(r){ return r.status === 'refill-due'; }).length;

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Reports</h1></div>' +
            '<div class="kpi-grid">' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#e0f2f7">👥</div><div><p class="kpi-label">Total Patients</p><p class="kpi-value">' + patients.length + '</p></div></div>' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#d1fae5">💊</div><div><p class="kpi-label">Active Medications</p><p class="kpi-value">' + totalMeds + '</p></div></div>' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#fef3c7">📝</div><div><p class="kpi-label">Total Prescriptions</p><p class="kpi-value">' + allRx.length + '</p></div></div>' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#fee2e2">⚠️</div><div><p class="kpi-label">Refills Due</p><p class="kpi-value" style="color:var(--destructive)">' + refillsDue + '</p></div></div>' +
            '</div>' +
            '<div class="doc-card" style="padding:0;overflow:hidden">' +
                '<div style="padding:16px 20px"><h2 class="doc-card-title">Patient Overview</h2></div>' +
                '<table class="doc-table"><thead><tr><th>Patient</th><th>Condition</th><th>Medications</th><th>Email</th></tr></thead><tbody>' +
                patients.map(function(p) {
                    return '<tr onclick="viewPatient(' + p.id + ')" class="patient-row">' +
                        '<td><div class="patient-name-cell">' + avatarEl(p.name[0]+p.surname[0], 32) + '<span class="pname">' + p.name + ' ' + p.surname + '</span></div></td>' +
                        '<td>' + (p.condition||'—') + '</td>' +
                        '<td>' + (p.medications||[]).length + '</td>' +
                        '<td>' + p.email + '</td>' +
                    '</tr>';
                }).join('') +
                '</tbody></table>' +
            '</div>' +
        '</div>';
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

let activeReceiverId = null;

async function renderDoctorMessages(receiverId) {
    document.getElementById('desktop-content').innerHTML = loading();
    const threads = await apiGetThreads().catch(() => []);
    const userId  = getUser().id;

    const threadMap = {};
    threads.forEach(function(m) {
        const otherId   = m.sender_id === userId ? m.receiver_id   : m.sender_id;
        const otherName = m.sender_id === userId
            ? (m.receiver_name + ' ' + m.receiver_surname)
            : (m.sender_name  + ' ' + m.sender_surname);
        if (!threadMap[otherId]) threadMap[otherId] = { id: otherId, name: otherName, messages: [], unread: false };
        threadMap[otherId].messages.push(m);
        if (!m.is_read && m.sender_id !== userId) threadMap[otherId].unread = true;
    });

    const keys = Object.keys(threadMap);
    if (!receiverId && keys.length) receiverId = parseInt(keys[0]);
    activeReceiverId = receiverId;

    const listHtml = keys.length === 0
        ? '<p style="padding:16px;color:var(--muted-foreground)">No messages yet.</p>'
        : keys.map(function(k) {
            const t    = threadMap[k];
            const last = t.messages[t.messages.length-1];
            return '<div class="msg-thread-item' + (t.id === receiverId ? ' active' : '') + (t.unread ? ' unread' : '') + '" onclick="renderDoctorMessages(' + t.id + ')">' +
                avatarEl(t.name.split(' ').map(function(w){return w[0];}).join(''), 40) +
                '<div class="msg-thread-info"><div class="msg-thread-top"><span class="msg-thread-name">' + t.name + '</span></div>' +
                '<span class="msg-thread-preview">' + last.body.substring(0,50) + (last.body.length>50?'…':'') + '</span></div>' +
                (t.unread ? '<span class="unread-dot"></span>' : '') +
            '</div>';
          }).join('');

    const activeThread = receiverId ? threadMap[receiverId] : null;
    const bubblesHtml  = activeThread
        ? activeThread.messages.map(function(m) {
            const mine = m.sender_id === userId;
            return '<div class="msg-bubble-wrap ' + (mine?'bubble-right':'bubble-left') + '">' +
                '<div class="msg-bubble ' + (mine?'bubble-doc':'bubble-patient') + '">' +
                '<p>' + m.body + '</p>' +
                '<span class="bubble-time">' + new Date(m.sent_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) + '</span>' +
                '</div></div>';
          }).join('')
        : '<p style="padding:20px;color:var(--muted-foreground);text-align:center">Select a conversation.</p>';

    const chatHeader = activeThread
        ? '<div class="msg-chat-header">' + avatarEl(activeThread.name.split(' ').map(function(w){return w[0];}).join(''), 40) +
          '<div><span class="msg-chat-name">' + activeThread.name + '</span></div></div>'
        : '';

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page" style="height:calc(100vh - 120px);display:flex;flex-direction:column">' +
            '<div class="doc-page-header" style="flex-shrink:0"><h1 class="doc-title">Messages</h1></div>' +
            '<div class="msg-layout" style="flex:1;min-height:0">' +
                '<div class="msg-sidebar"><div class="msg-thread-list">' + listHtml + '</div></div>' +
                '<div class="msg-chat">' +
                    chatHeader +
                    '<div class="msg-chat-body" id="doc-chat-body">' + bubblesHtml + '</div>' +
                    '<div class="msg-input-row">' +
                        '<input id="msg-input" class="msg-input" placeholder="Type a message..." onkeydown="if(event.key===\'Enter\')sendDoctorMessage()">' +
                        '<button class="btn-primary" onclick="sendDoctorMessage()">Send</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() { const b = document.getElementById('doc-chat-body'); if (b) b.scrollTop = b.scrollHeight; }, 50);
}

async function sendDoctorMessage() {
    const input = document.getElementById('msg-input');
    const text  = input ? input.value.trim() : '';
    if (!text || !activeReceiverId) return;
    await apiSendMessage(getUser().id, activeReceiverId, text);
    input.value = '';
    renderDoctorMessages(activeReceiverId);
}

function openMessagePatient(userId, name) {
    activeReceiverId = userId;
    showDoctorPage('messages');
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
                    '<div><p style="font-weight:600;font-size:18px">Dr. ' + user.name + ' ' + user.surname + '</p><p style="color:var(--muted-foreground)">Doctor</p></div>' +
                '</div>' +
            '</div>' +
            '<div class="doc-card">' +
                '<h2 class="doc-card-title">🔔 Notifications</h2>' +
                '<div class="settings-list">' +
                [['Refill Reminders','Remind when prescriptions are due',true],
                 ['New Patient Messages','Notify on incoming messages',true],
                 ['Weekly Summary Report','Email summary every Monday',false]
                ].map(function(s){ return '<div class="setting-item"><div class="setting-info"><p class="setting-label">' + s[0] + '</p><p class="setting-desc">' + s[1] + '</p></div><label class="toggle"><input type="checkbox"' + (s[2]?' checked':'') + '><span class="toggle-slider"></span></label></div>'; }).join('') +
                '</div>' +
            '</div>' +
            '<div class="doc-card">' +
                '<h2 class="doc-card-title">🔒 Account</h2>' +
                '<button class="btn-delete" style="margin-top:8px;padding:10px 20px" onclick="handleLogout()">Sign Out</button>' +
            '</div>' +
        '</div>';
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN VIEW
// ══════════════════════════════════════════════════════════════════════════════

function showAdminPage(page) {
    const content = document.getElementById('desktop-content');

    if (page === 'dashboard') {
        renderAdminDashboard();
    } 
    else if (page === 'users') {
        renderAdminUsers();
    } 
    else if (page === 'doctors') {
        renderAdminDoctors();
    } 
    else if (page === 'patients') {
        renderAdminPatients();
    } 
    else if (page === 'messages') {
        renderAdminMessagesPage(); 
    } 
    else if (page === 'settings') {
        renderAdminSettings();
    }
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

async function renderAdminDashboard() {
    document.getElementById('desktop-content').innerHTML = loading();
    const stats = await apiFetch('/admin/stats').catch(() => ({}));

    const userRows = (stats.users || []).map(function(u) {
        return '<div class="kpi-card"><div class="kpi-icon" style="background:#e0f2f7">👤</div>' +
            '<div><p class="kpi-label">' + u.role.charAt(0).toUpperCase() + u.role.slice(1) + 's</p>' +
            '<p class="kpi-value">' + u.total + '</p></div></div>';
    }).join('');

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Admin Dashboard</h1></div>' +
            '<div class="kpi-grid">' +
                userRows +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#d1fae5">💊</div><div><p class="kpi-label">Medications</p><p class="kpi-value">' + (stats.medications || 0) + '</p></div></div>' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#ede9fe">📝</div><div><p class="kpi-label">Prescriptions</p><p class="kpi-value">' + (stats.prescriptions || 0) + '</p></div></div>' +
                '<div class="kpi-card"><div class="kpi-icon" style="background:#fef3c7">💬</div><div><p class="kpi-label">Messages</p><p class="kpi-value">' + (stats.messages || 0) + '</p></div></div>' +
            '</div>' +
            '<div class="dash-row" style="gap:16px;margin-top:20px">' +
                '<div class="doc-card flex-1"><div class="doc-card-title-row"><h2 class="doc-card-title">🩺 Doctors</h2><button class="btn-sm" onclick="showAdminPage(\'doctors\')">Manage →</button></div><p class="empty-msg" style="padding:12px 0">Total: ' + (stats.doctors || 0) + ' doctors registered</p></div>' +
                '<div class="doc-card flex-1"><div class="doc-card-title-row"><h2 class="doc-card-title">🏥 Patients</h2><button class="btn-sm" onclick="showAdminPage(\'patients\')">Manage →</button></div><p class="empty-msg" style="padding:12px 0">Total: ' + (stats.patients || 0) + ' patients registered</p></div>' +
            '</div>' +
        '</div>';
}

// ── USERS ─────────────────────────────────────────────────────────────────────

async function renderAdminUsers() {
    document.getElementById('desktop-content').innerHTML = loading();
    const users = await apiFetch('/admin/users').catch(() => []);

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">All Users</h1></div>' +
            '<div class="doc-card" style="padding:0;overflow:hidden">' +
                '<table class="doc-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
                users.map(function(u) {
                    const statusColor = u.status === 'active' ? 'var(--accent)' : u.status === 'suspended' ? '#f59e0b' : 'var(--destructive)';
                    return '<tr>' +
                        '<td><div class="patient-name-cell">' + avatarEl((u.name[0]||'?')+(u.surname[0]||'?'), 32) + '<span class="pname">' + u.name + ' ' + u.surname + '</span></div></td>' +
                        '<td>' + u.email + '</td>' +
                        '<td><span class="badge badge-stable">' + u.role + '</span></td>' +
                        '<td><span style="font-weight:600;color:' + statusColor + '">' + (u.status || 'active') + '</span></td>' +
                        '<td><div style="display:flex;gap:6px">' +
                            '<button class="btn-sm" onclick="editUser(' + u.id + ',\'' + u.name + '\',\'' + u.surname + '\',\'' + u.email + '\',\'' + u.role + '\',\'' + (u.status||'active') + '\')">Edit</button>' +
                            '<button class="btn-sm btn-sm-danger" onclick="toggleUserStatus(' + u.id + ',\'' + (u.status||'active') + '\')">'+  (u.status === 'suspended' ? 'Activate' : 'Suspend') + '</button>' +
                        '</div></td>' +
                    '</tr>';
                }).join('') +
                '</tbody></table>' +
            '</div>' +
        '</div>' +
        // Edit modal
        '<div id="admin-user-modal" class="modal-overlay hidden"><div class="modal" style="max-width:440px">' +
            '<h2 class="modal-title">Edit User</h2>' +
            '<input type="hidden" id="edit-user-id">' +
            '<div class="form-group"><label class="form-label">First Name</label><input type="text" id="edit-user-name" class="form-input"></div>' +
            '<div class="form-group"><label class="form-label">Last Name</label><input type="text" id="edit-user-surname" class="form-input"></div>' +
            '<div class="form-group"><label class="form-label">Email</label><input type="email" id="edit-user-email" class="form-input"></div>' +
            '<div class="form-group"><label class="form-label">Role</label><select id="edit-user-role" class="form-input"><option value="patient">Patient</option><option value="doctor">Doctor</option><option value="admin">Admin</option></select></div>' +
            '<div class="form-group"><label class="form-label">Status</label><select id="edit-user-status" class="form-input"><option value="active">Active</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option></select></div>' +
            '<div class="modal-buttons"><button class="btn-add" onclick="saveUser()">Save Changes</button><button class="btn-cancel" onclick="closeAdminModal(\'admin-user-modal\')">Cancel</button></div>' +
        '</div></div>';
}

function editUser(id, name, surname, email, role, status) {
    document.getElementById('edit-user-id').value      = id;
    document.getElementById('edit-user-name').value    = name;
    document.getElementById('edit-user-surname').value = surname;
    document.getElementById('edit-user-email').value   = email;
    document.getElementById('edit-user-role').value    = role;
    document.getElementById('edit-user-status').value  = status;
    document.getElementById('admin-user-modal').classList.remove('hidden');
}

async function saveUser() {
    const id = document.getElementById('edit-user-id').value;
    await apiFetch('/admin/users/' + id, 'PUT', {
        name:    document.getElementById('edit-user-name').value.trim(),
        surname: document.getElementById('edit-user-surname').value.trim(),
        email:   document.getElementById('edit-user-email').value.trim(),
        role:    document.getElementById('edit-user-role').value,
        status:  document.getElementById('edit-user-status').value
    });
    closeAdminModal('admin-user-modal');
    renderAdminUsers();
}

async function toggleUserStatus(id, currentStatus) {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await apiFetch('/admin/users/' + id, 'PUT', { status: newStatus });
    renderAdminUsers();
}

// ── DOCTORS ───────────────────────────────────────────────────────────────────

async function renderAdminDoctors() {
    document.getElementById('desktop-content').innerHTML = loading();
    const doctors = await apiFetch('/admin/doctors').catch(() => []);

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Doctors</h1></div>' +
            '<div class="doc-card" style="padding:0;overflow:hidden">' +
                '<table class="doc-table"><thead><tr><th>Name</th><th>Email</th><th>Specialization</th><th>Patients</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
                doctors.map(function(d) {
                    const statusColor = d.status === 'active' || !d.status ? 'var(--accent)' : d.status === 'suspended' ? '#f59e0b' : 'var(--destructive)';
                    return '<tr>' +
                        '<td><div class="patient-name-cell">' + avatarEl((d.name[0]||'?')+(d.surname[0]||'?'), 32) + '<span class="pname">Dr. ' + d.name + ' ' + d.surname + '</span></div></td>' +
                        '<td>' + d.email + '</td>' +
                        '<td>' + (d.specialization || '—') + '</td>' +
                        '<td>' + d.patient_count + '</td>' +
                        '<td><span style="font-weight:600;color:' + statusColor + '">' + (d.status || 'active') + '</span></td>' +
                        '<td><div style="display:flex;gap:6px">' +
                            '<button class="btn-sm" onclick="editDoctor(' + d.id + ',' + d.user_id + ',\'' + d.name + '\',\'' + d.surname + '\',\'' + d.email + '\',\'' + (d.specialization||'') + '\',\'' + (d.status||'active') + '\')">Edit</button>' +
                            '<button class="btn-sm btn-sm-danger" onclick="toggleDoctorStatus(' + d.id + ',\'' + (d.status||'active') + '\')">'+  (d.status === 'suspended' ? 'Activate' : 'Suspend') + '</button>' +
                        '</div></td>' +
                    '</tr>';
                }).join('') +
                '</tbody></table>' +
            '</div>' +
        '</div>' +
        '<div id="admin-doctor-modal" class="modal-overlay hidden"><div class="modal" style="max-width:440px">' +
            '<h2 class="modal-title">Edit Doctor</h2>' +
            '<input type="hidden" id="edit-doc-id"><input type="hidden" id="edit-doc-user-id">' +
            '<div class="form-group"><label class="form-label">First Name</label><input type="text" id="edit-doc-name" class="form-input"></div>' +
            '<div class="form-group"><label class="form-label">Last Name</label><input type="text" id="edit-doc-surname" class="form-input"></div>' +
            '<div class="form-group"><label class="form-label">Email</label><input type="email" id="edit-doc-email" class="form-input"></div>' +
            '<div class="form-group"><label class="form-label">Specialization</label><input type="text" id="edit-doc-spec" class="form-input" placeholder="e.g. Cardiology"></div>' +
            '<div class="form-group"><label class="form-label">Status</label><select id="edit-doc-status" class="form-input"><option value="active">Active</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option></select></div>' +
            '<div class="modal-buttons"><button class="btn-add" onclick="saveDoctor()">Save Changes</button><button class="btn-cancel" onclick="closeAdminModal(\'admin-doctor-modal\')">Cancel</button></div>' +
        '</div></div>';
}

function editDoctor(id, userId, name, surname, email, spec, status) {
    document.getElementById('edit-doc-id').value      = id;
    document.getElementById('edit-doc-user-id').value = userId;
    document.getElementById('edit-doc-name').value    = name;
    document.getElementById('edit-doc-surname').value = surname;
    document.getElementById('edit-doc-email').value   = email;
    document.getElementById('edit-doc-spec').value    = spec;
    document.getElementById('edit-doc-status').value  = status;
    document.getElementById('admin-doctor-modal').classList.remove('hidden');
}

async function saveDoctor() {
    const id = document.getElementById('edit-doc-id').value;
    await apiFetch('/admin/doctors/' + id, 'PUT', {
        user_id:        parseInt(document.getElementById('edit-doc-user-id').value),
        name:           document.getElementById('edit-doc-name').value.trim(),
        surname:        document.getElementById('edit-doc-surname').value.trim(),
        email:          document.getElementById('edit-doc-email').value.trim(),
        specialization: document.getElementById('edit-doc-spec').value.trim(),
        status:         document.getElementById('edit-doc-status').value
    });
    closeAdminModal('admin-doctor-modal');
    renderAdminDoctors();
}

async function toggleDoctorStatus(id, currentStatus) {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await apiFetch('/admin/doctors/' + id, 'PUT', { status: newStatus });
    renderAdminDoctors();
}

// ── PATIENTS ──────────────────────────────────────────────────────────────────

async function renderAdminPatients() {
    document.getElementById('desktop-content').innerHTML = loading();
    const patients = await apiFetch('/admin/patients').catch(() => []);
    const doctors  = await apiFetch('/admin/doctors').catch(() => []);
    const docOpts  = doctors.map(function(d) {
        return '<option value="' + d.id + '">Dr. ' + d.name + ' ' + d.surname + '</option>';
    }).join('');

    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Patients</h1></div>' +
            '<div class="doc-card" style="padding:0;overflow:hidden">' +
                '<table class="doc-table"><thead><tr><th>Name</th><th>Email</th><th>Condition</th><th>Doctor</th><th>Meds</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
                patients.map(function(p) {
                    const statusColor = p.status === 'active' || !p.status ? 'var(--accent)' : p.status === 'suspended' ? '#f59e0b' : 'var(--destructive)';
                    const docName = p.doctor_name ? 'Dr. ' + p.doctor_name + ' ' + p.doctor_surname : '—';
                    return '<tr>' +
                        '<td><div class="patient-name-cell">' + avatarEl((p.name[0]||'?')+(p.surname[0]||'?'), 32) + '<span class="pname">' + p.name + ' ' + p.surname + '</span></div></td>' +
                        '<td>' + p.email + '</td>' +
                        '<td>' + (p.condition || '—') + '</td>' +
                        '<td>' + docName + '</td>' +
                        '<td>' + p.medication_count + '</td>' +
                        '<td><span style="font-weight:600;color:' + statusColor + '">' + (p.status || 'active') + '</span></td>' +
                        '<td><div style="display:flex;gap:6px">' +
                            '<button class="btn-sm" onclick="editPatient(' + p.id + ',' + p.user_id + ',\'' + p.name + '\',\'' + p.surname + '\',\'' + p.email + '\',\'' + (p.condition||'') + '\',\'' + (p.doctor_id||'') + '\',\'' + (p.status||'active') + '\')">Edit</button>' +
                            '<button class="btn-sm btn-sm-danger" onclick="togglePatientStatus(' + p.id + ',\'' + (p.status||'active') + '\')">'+  (p.status === 'suspended' ? 'Activate' : 'Suspend') + '</button>' +
                        '</div></td>' +
                    '</tr>';
                }).join('') +
                '</tbody></table>' +
            '</div>' +
        '</div>' +
        '<div id="admin-patient-modal" class="modal-overlay hidden"><div class="modal" style="max-width:440px">' +
            '<h2 class="modal-title">Edit Patient</h2>' +
            '<input type="hidden" id="edit-pat-id"><input type="hidden" id="edit-pat-user-id">' +
            '<div class="form-group"><label class="form-label">First Name</label><input type="text" id="edit-pat-name" class="form-input"></div>' +
            '<div class="form-group"><label class="form-label">Last Name</label><input type="text" id="edit-pat-surname" class="form-input"></div>' +
            '<div class="form-group"><label class="form-label">Email</label><input type="email" id="edit-pat-email" class="form-input"></div>' +
            '<div class="form-group"><label class="form-label">Condition</label><input type="text" id="edit-pat-condition" class="form-input"></div>' +
            '<div class="form-group"><label class="form-label">Assigned Doctor</label><select id="edit-pat-doctor" class="form-input"><option value="">— Unassigned —</option>' + docOpts + '</select></div>' +
            '<div class="form-group"><label class="form-label">Status</label><select id="edit-pat-status" class="form-input"><option value="active">Active</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option></select></div>' +
            '<div class="modal-buttons"><button class="btn-add" onclick="savePatient()">Save Changes</button><button class="btn-cancel" onclick="closeAdminModal(\'admin-patient-modal\')">Cancel</button></div>' +
        '</div></div>';
}

function editPatient(id, userId, name, surname, email, condition, doctorId, status) {
    document.getElementById('edit-pat-id').value        = id;
    document.getElementById('edit-pat-user-id').value   = userId;
    document.getElementById('edit-pat-name').value      = name;
    document.getElementById('edit-pat-surname').value   = surname;
    document.getElementById('edit-pat-email').value     = email;
    document.getElementById('edit-pat-condition').value = condition;
    document.getElementById('edit-pat-status').value    = status;
    if (doctorId) document.getElementById('edit-pat-doctor').value = doctorId;
    document.getElementById('admin-patient-modal').classList.remove('hidden');
}

async function savePatient() {
    const id = document.getElementById('edit-pat-id').value;
    const doctorId = document.getElementById('edit-pat-doctor').value;
    await apiFetch('/admin/patients/' + id, 'PUT', {
        user_id:   parseInt(document.getElementById('edit-pat-user-id').value),
        name:      document.getElementById('edit-pat-name').value.trim(),
        surname:   document.getElementById('edit-pat-surname').value.trim(),
        email:     document.getElementById('edit-pat-email').value.trim(),
        condition: document.getElementById('edit-pat-condition').value.trim(),
        doctor_id: doctorId ? parseInt(doctorId) : null,
        status:    document.getElementById('edit-pat-status').value
    });
    closeAdminModal('admin-patient-modal');
    renderAdminPatients();
}

async function togglePatientStatus(id, currentStatus) {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await apiFetch('/admin/patients/' + id, 'PUT', { status: newStatus });
    renderAdminPatients();
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

function renderAdminSettings() {
    const user = getUser();
    document.getElementById('desktop-content').innerHTML =
        '<div class="doc-page">' +
            '<div class="doc-page-header"><h1 class="doc-title">Settings</h1></div>' +
            '<div class="doc-card">' +
                '<h2 class="doc-card-title">👤 Profile</h2>' +
                '<div class="settings-profile">' + avatarEl(user.name[0]+user.surname[0], 64) +
                    '<div><p style="font-weight:600;font-size:18px">' + user.name + ' ' + user.surname + '</p><p style="color:var(--muted-foreground)">Administrator</p></div>' +
                '</div>' +
            '</div>' +
            '<div class="doc-card">' +
                '<h2 class="doc-card-title">🔒 Account</h2>' +
                '<button class="btn-delete" style="margin-top:8px;padding:10px 20px" onclick="handleLogout()">Sign Out</button>' +
            '</div>' +
        '</div>';
}




// ── SHARED ────────────────────────────────────────────────────────────────────

function closeAdminModal(id) {
    document.getElementById(id).classList.add('hidden');
}
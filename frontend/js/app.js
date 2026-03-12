// Main Application Logic

// Get elements
const mobileLayout = document.getElementById('mobile-layout');
const desktopLayout = document.getElementById('desktop-layout');
const roleSelector = document.getElementById('role-selector');
const roleSelectorDesktop = document.getElementById('role-selector-desktop');
const doctorNav = document.getElementById('doctor-nav');
const adminNav = document.getElementById('admin-nav');

// Switch layout based on role
function switchLayout(role) {

    if (role === 'patient') {
        // Show mobile layout
        mobileLayout.classList.remove('hidden');
        desktopLayout.classList.add('hidden');
        loadPatientDashboard();
    }
    else if (role === 'doctor') {
        // Show desktop layout with doctor nav
        mobileLayout.classList.add('hidden');
        desktopLayout.classList.remove('hidden');
        doctorNav.classList.remove('hidden');
        adminNav.classList.add('hidden');
    }
    else if (role === 'admin') {
        // Show desktop layout with admin nav
        mobileLayout.classList.add('hidden');
        desktopLayout.classList.remove('hidden');
        doctorNav.classList.add('hidden');
        adminNav.classList.remove('hidden');
    }

    // Sync both dropdowns
    roleSelector.value = role;
    roleSelectorDesktop.value = role;
}

// Load Patient Dashboard
function loadPatientDashboard() {
    // Show dashboard page
    showPatientPage('dashboard');

    // Set current date
    setCurrentDate();

    // Update adherence rate
    updateAdherenceRate();

    // Load medications
    loadMedications();
}

// Set current date and greeting
function setCurrentDate() {
    const dateElement = document.getElementById('current-date');
    const greetingElement = document.querySelector('.greeting-title');

        const today = new Date();
        const hours = today.getHours();

    // Set greeting based on time
    let greeting = 'Good morning!';
    if (hours >= 12 && hours < 17) {
            greeting = 'Good afternoon!';
    } else if (hours >= 17) {
            greeting = 'Good Evening!';
    }

    greetingElement.textContent = greeting;

    // Sets date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('en-US', options);
}

// Update adherence rate (calculates for today)
function updateAdherenceRate() {
    const today = new Date().toISOString().split('T')[0];
    const takenToday = getTakenForDate(today);
    const totalMeds = appData.medications.length;

    if (totalMeds === 0) {
        setAdherenceRate(0);
        return;
    }

    const takenCount = takenToday.length;
    const rate = Math.round((takenCount / totalMeds) * 100);
    setAdherenceRate(rate);
}

// Set adherence rate display
function setAdherenceRate(rate) {
    const percentElement = document.getElementById('adherence-percent');
    const circleElement = document.getElementById('adherence-circle-text');
    const progressElement = document.getElementById('progress-fill');

    percentElement.textContent = rate + '%';
    circleElement.textContent = rate + '%';
    progressElement.style.width = rate + '%';
}

// Load medications list
function loadMedications() {
    const listElement = document.getElementById('medications-list');
    listElement.innerHTML = '';

    appData.medications.forEach(function(med) {
        const card = createMedicationCard(med);
        listElement.appendChild(card);
    });
}

// Create medication card
function createMedicationCard(med) {
    const card = document.createElement('div');
    card.className = 'medication-card';
    card.id = 'med-' + med.id;

    // Format time
    const timeFormatted = formatTime(med.time);

    // Check if taken today
    const taken = isTakenToday(med.id);
    const btnText = taken ? 'Taken' : 'Mark as Taken';
    const btnClass = taken ? 'btn-taken taken' : 'btn-taken';

    card.innerHTML =
        '<div class="medication-info">' +
            '<div class="medication-icon">' + med.name.charAt(0) + '</div>' +
            '<div class="medication-details">' +
                '<span class="medication-name">' + med.name + '</span>' +
                '<span class="medication-dosage">' + med.dose + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="medication-time">' +
            '<span class="medication-time-text">' + timeFormatted + '</span>' +
            '<p class="medication-frequency">' + med.frequency + '</p>' +
            '<button class="' + btnClass + '" onclick="markAsTaken(' + med.id + ')">' + btnText + '</button>' +
        '</div>';

    return card;
}

// Format time from 24h to 12h
function formatTime(time) {
    const parts = time.split(':');
    let hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return hours + ':' + minutes + ' ' + ampm;
}

// Mark medication as taken
function markAsTaken(id) {
    // Record in localStorage
    if (!isTakenToday(id)) {
        recordTaken(id);
    }

    // Reload medications display
    loadMedications();

    // Update adherence rate
    updateAdherenceRate();

    // Update history calendar if visible
    const historyPage = document.getElementById('patient-history');
    if (historyPage && !historyPage.classList.contains('hidden')) {
        loadHistoryPage();
    }
}

// Listen for dropdown changes
roleSelector.addEventListener('change', function() {
    switchLayout(this.value);
});

roleSelectorDesktop.addEventListener('change', function() {
    switchLayout(this.value);
});

// Note: doctor page routing listeners are added after doctor functions are defined below

// Show a specific patient page
function showPatientPage(pageName) {
    // Get all patient pages
    const dashboard = document.getElementById('patient-dashboard');
    const medications = document.getElementById('patient-medications');
    const history = document.getElementById('patient-history');
    const reminders = document.getElementById('patient-reminders');

    // Hide all pages
    dashboard.classList.add('hidden');
    medications.classList.add('hidden');
    if (history) history.classList.add('hidden');
    if (reminders) reminders.classList.add('hidden');

    // Show the selected page
    if (pageName === 'dashboard') {
        dashboard.classList.remove('hidden');
    } else if (pageName === 'medications') {
        medications.classList.remove('hidden');
        loadAllMedications();
    } else if (pageName === 'history') {
        if (history) {
            history.classList.remove('hidden');
            loadHistoryPage();
        }
    } else if (pageName === 'reminders') {
        if (reminders) {
            reminders.classList.remove('hidden');
            loadRemindersPage();
        }
    }

    // Update nav items active state
    const navItems = document.querySelectorAll('#bottom-nav .nav-item');
    navItems.forEach(function(item) {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
}

// Load all medications for the medications page
function loadAllMedications() {
    const listElement = document.getElementById('all-medications-list');
    listElement.innerHTML = '';

    appData.medications.forEach(function(med) {
        const card = createFullMedicationCard(med);
        listElement.appendChild(card);
    });
}

// Create full medication card for medications page
function createFullMedicationCard(med) {
    const card = document.createElement('div');
    card.className = 'medication-card-full';

    const timeFormatted = formatTime(med.time);

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
            '<div class="detail-item">' +
                '<span class="detail-label">Time</span>' +
                '<span class="detail-value">' + timeFormatted + '</span>' +
            '</div>' +
            '<div class="detail-item">' +
                '<span class="detail-label">Frequency</span>' +
                '<span class="detail-value">' + med.frequency + '</span>' +
            '</div>' +
        '</div>';

    return card;
}

// Bottom nav click handlers
const bottomNav = document.getElementById('bottom-nav');
bottomNav.addEventListener('click', function(e) {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        const page = navItem.dataset.page;
        showPatientPage(page);
    }
});

// History Page Variables
let currentWeekStart = getWeekStart(new Date());

// Get start of week (Sunday)
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Format date as "Feb 16"
function formatShortDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()] + ' ' + date.getDate();
}

// Format date as "yyyy-mm-dd" using local date (avoids UTC timezone shift)
function formatDateStr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

// Load History Page
function loadHistoryPage() {
    updateWeekDisplay();
    renderHistoryTable();
}

// Update week dates display
function updateWeekDisplay() {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekDates = document.getElementById('week-dates');
    const weekAdherence = document.getElementById('week-adherence');
    const historyCircle = document.getElementById('history-adherence-circle');

    if (weekDates) {
        weekDates.textContent = formatShortDate(currentWeekStart) + ' - ' + formatShortDate(weekEnd) + ', ' + weekEnd.getFullYear();
    }

    const adherence = calculateAdherence(currentWeekStart, weekEnd);
    if (weekAdherence) {
        weekAdherence.textContent = adherence + '% Adherence';
    }
    if (historyCircle) {
        historyCircle.textContent = adherence + '%';
    }
}

// Render history table
function renderHistoryTable() {
    const table = document.getElementById('history-table');
    if (!table) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build header row
    let headerHtml = '<thead><tr><th>Medication</th>';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekStart);
        day.setDate(day.getDate() + i);
        const isToday = day.getTime() === today.getTime();
        const todayClass = isToday ? ' class="today"' : '';
        headerHtml += '<th' + todayClass + '><div>' + days[i] + '</div><div class="day-date">' + formatShortDate(day) + '</div></th>';
    }
    headerHtml += '</tr></thead>';

    // Build body rows
    let bodyHtml = '<tbody>';

    if (appData.medications.length === 0) {
        bodyHtml += '<tr><td colspan="8" class="empty-message">No medications to display</td></tr>';
    } else {
        appData.medications.forEach(function(med) {
            bodyHtml += '<tr>';
            bodyHtml += '<td><div class="med-cell-name">' + med.name + '</div><div class="med-cell-dosage">' + med.dose + '</div></td>';

            for (let i = 0; i < 7; i++) {
                const day = new Date(currentWeekStart);
                day.setDate(day.getDate() + i);
                const dateStr = formatDateStr(day);

                // Check status for this day
                const takenRecords = getTakenForDate(dateStr);
                const wasTaken = takenRecords.some(function(t) { return t.visaId === med.id; });

                let statusClass = 'scheduled';
                let statusIcon = '';

                if (day > today) {
                    statusClass = 'scheduled';
                } else if (wasTaken) {
                    statusClass = 'taken';
                    statusIcon = '✓';
                } else if (day < today) {
                    statusClass = 'missed';
                    statusIcon = '✗';
                }

                bodyHtml += '<td><span class="status-icon ' + statusClass + '">' + statusIcon + '</span></td>';
            }

            bodyHtml += '</tr>';
        });
    }
    bodyHtml += '</tbody>';

    table.innerHTML = headerHtml + bodyHtml;
}

// Week navigation
document.addEventListener('click', function(e) {
    if (e.target.id === 'prev-week') {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        loadHistoryPage();
    } else if (e.target.id === 'next-week') {
        const nextWeek = new Date(currentWeekStart);
        nextWeek.setDate(nextWeek.getDate() + 7);
        if (nextWeek <= new Date()) {
            currentWeekStart = nextWeek;
        loadHistoryPage();
        }
    } else if (e.target.id ==='current-week-btn') {
        currentWeekStart = getWeekStart(new Date());
        loadHistoryPage();
    }
});

// Starts with patient view
switchLayout('patient');

// ══════════════════════════════════════════════════════════════════════════════
//  DOCTOR VIEW
// ══════════════════════════════════════════════════════════════════════════════

// ── Routing ──────────────────────────────────────────────────────────────────

function showDoctorPage(pageName) {
    document.getElementById('desktop-content').innerHTML = '';

    const items = document.querySelectorAll('#doctor-nav .sidebar-item');
    items.forEach(function(item) {
        item.classList.remove('active');
        if (item.dataset.page === pageName) item.classList.add('active');
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

// Load doctor dashboard when role selector is changed to doctor
document.getElementById('role-selector').addEventListener('change', function() {
    if (this.value === 'doctor') showDoctorPage('dashboard');
});

// ── Shared helpers ────────────────────────────────────────────────────────────

function adherenceColor(pct) {
    if (pct >= 80) return 'var(--accent)';
    if (pct >= 60) return '#f59e0b';
    return 'var(--destructive)';
}

function statusBadge(status) {
    const map = {
        'stable':      ['badge-stable',   'Stable'],
        'at-risk':     ['badge-warning',  'At Risk'],
        'critical':    ['badge-critical', 'Critical'],
        'active':      ['badge-stable',   'Active'],
        'refill-due':  ['badge-warning',  'Refill Due'],
        'inactive':    ['badge-muted',    'Inactive'],
    };
    const [cls, label] = map[status] || ['badge-muted', status];
    return `<span class="badge ${cls}">${label}</span>`;
}

function avatarEl(initials, size) {
    size = size || 40;
    return `<div class="doc-avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.38)}px">${initials}</div>`;
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────

function renderDoctorDashboard() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    const todayApts = doctorData.appointments.filter(a => a.date === '2026-03-11');
    const avgAdherence = Math.round(doctorData.patients.reduce((s, p) => s + p.adherence, 0) / doctorData.patients.length);
    const atRisk = doctorData.patients.filter(p => p.status === 'at-risk' || p.status === 'critical').length;
    const refillsDue = doctorData.prescriptions.filter(p => p.status === 'refill-due').length;

    // Alerts HTML
    const alertsHtml = doctorData.alerts.map(a => {
        const iconMap = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
        const clsMap  = { critical: 'alert-critical', warning: 'alert-warning', info: 'alert-info' };
        const link = a.patientId ? `<button class="alert-link" onclick="viewPatient(${a.patientId})">View Patient →</button>` : '';
        return `<div class="doc-alert ${clsMap[a.type]}"><span class="alert-icon">${iconMap[a.type]}</span><span class="alert-msg">${a.message}</span>${link}</div>`;
    }).join('');

    // Today's appointments HTML
    const aptsHtml = todayApts.length === 0
        ? '<p class="empty-msg">No appointments today.</p>'
        : todayApts.map(a => `
            <div class="apt-row">
                ${avatarEl(a.avatar, 36)}
                <div class="apt-info">
                    <span class="apt-name">${a.patientName}</span>
                    <span class="apt-type">${a.type}</span>
                </div>
                <span class="apt-time">${a.time}</span>
            </div>`).join('');

    // Low adherence patients (bottom 3)
    const lowAdherence = [...doctorData.patients].sort((a,b) => a.adherence - b.adherence).slice(0,3);
    const lowHtml = lowAdherence.map(p => `
        <div class="low-patient-row" onclick="viewPatient(${p.id})">
            ${avatarEl(p.avatar, 36)}
            <div class="low-info">
                <span class="low-name">${p.name}</span>
                <div class="low-bar-wrap">
                    <div class="low-bar" style="width:${p.adherence}%;background:${adherenceColor(p.adherence)}"></div>
                </div>
            </div>
            <span class="low-pct" style="color:${adherenceColor(p.adherence)}">${p.adherence}%</span>
        </div>`).join('');

    document.getElementById('desktop-content').innerHTML = `
        <div class="doc-page">
            <div class="doc-page-header">
                <div>
                    <h1 class="doc-title">Good morning, ${doctorData.doctor.name}!</h1>
                    <p class="doc-subtitle">${dateStr}</p>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-icon" style="background:#e0f2f7">👥</div>
                    <div>
                        <p class="kpi-label">Total Patients</p>
                        <p class="kpi-value">${doctorData.patients.length}</p>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon" style="background:#d1fae5">📊</div>
                    <div>
                        <p class="kpi-label">Avg Adherence</p>
                        <p class="kpi-value" style="color:${adherenceColor(avgAdherence)}">${avgAdherence}%</p>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon" style="background:#fef3c7">⚠️</div>
                    <div>
                        <p class="kpi-label">Patients At Risk</p>
                        <p class="kpi-value" style="color:#f59e0b">${atRisk}</p>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon" style="background:#fee2e2">💊</div>
                    <div>
                        <p class="kpi-label">Refills Due</p>
                        <p class="kpi-value" style="color:var(--destructive)">${refillsDue}</p>
                    </div>
                </div>
            </div>

            <!-- Alerts + Appointments row -->
            <div class="dash-row">
                <div class="doc-card flex-1">
                    <h2 class="doc-card-title">🔔 Alerts</h2>
                    <div class="alerts-list">${alertsHtml}</div>
                </div>
                <div class="doc-card" style="width:320px">
                    <h2 class="doc-card-title">📅 Today's Appointments</h2>
                    <div class="apts-list">${aptsHtml}</div>
                    <button class="btn-secondary" style="margin-top:14px;width:100%" onclick="showDoctorPage('patients')">View All Patients →</button>
                </div>
            </div>

            <!-- Low Adherence -->
            <div class="doc-card">
                <h2 class="doc-card-title">📉 Lowest Adherence Patients</h2>
                <div class="low-list">${lowHtml}</div>
                <button class="btn-secondary" style="margin-top:14px" onclick="showDoctorPage('patients')">View All Patients →</button>
            </div>
        </div>`;
}

// ── PATIENTS ──────────────────────────────────────────────────────────────────

function renderDoctorPatients(filterStatus) {
    filterStatus = filterStatus || 'all';

    const filters = ['all', 'stable', 'at-risk', 'critical'];
    const filterHtml = filters.map(f => `
        <button class="filter-btn ${filterStatus === f ? 'active' : ''}" onclick="renderDoctorPatients('${f}')">
            ${f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
        </button>`).join('');

    const visible = doctorData.patients.filter(p => filterStatus === 'all' || p.status === filterStatus);

    const rowsHtml = visible.map(p => `
        <tr class="patient-row" onclick="viewPatient(${p.id})">
            <td><div class="patient-name-cell">${avatarEl(p.avatar, 36)}<div><span class="pname">${p.name}</span><span class="page">${p.age} yrs</span></div></div></td>
            <td><span class="condition-text">${p.condition}</span></td>
            <td>${statusBadge(p.status)}</td>
            <td>
                <div class="adh-cell">
                    <div class="adh-bar-wrap"><div class="adh-bar" style="width:${p.adherence}%;background:${adherenceColor(p.adherence)}"></div></div>
                    <span style="color:${adherenceColor(p.adherence)};font-weight:600;min-width:36px">${p.adherence}%</span>
                </div>
            </td>
            <td>${p.medications} meds</td>
            <td>${p.lastVisit}</td>
            <td><button class="btn-sm" onclick="event.stopPropagation();viewPatient(${p.id})">View</button></td>
        </tr>`).join('');

    document.getElementById('desktop-content').innerHTML = `
        <div class="doc-page">
            <div class="doc-page-header">
                <h1 class="doc-title">Patients</h1>
                <div class="filter-row">${filterHtml}</div>
            </div>
            <div class="doc-card" style="padding:0;overflow:hidden">
                <table class="doc-table">
                    <thead>
                        <tr>
                            <th>Patient</th><th>Condition</th><th>Status</th>
                            <th>Adherence</th><th>Medications</th><th>Last Visit</th><th></th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        </div>`;
}

function viewPatient(id) {
    const p = doctorData.patients.find(pt => pt.id === id);
    if (!p) return;

    const pRx = doctorData.prescriptions.filter(rx => rx.patientId === id);
    const rxHtml = pRx.map(rx => `
        <div class="rx-row">
            <div class="rx-icon">${rx.medication.charAt(0)}</div>
            <div class="rx-info">
                <span class="rx-name">${rx.medication} <strong>${rx.dose}</strong></span>
                <span class="rx-freq">${rx.frequency} · Refill: ${rx.refillDate}</span>
            </div>
            ${statusBadge(rx.status)}
        </div>`).join('');

    document.getElementById('desktop-content').innerHTML = `
        <div class="doc-page">
            <div class="doc-page-header">
                <button class="btn-back" onclick="renderDoctorPatients()">← Back to Patients</button>
            </div>

            <!-- Patient Header -->
            <div class="doc-card patient-detail-header">
                ${avatarEl(p.avatar, 60)}
                <div class="pdh-info">
                    <h2 class="doc-title" style="margin:0">${p.name}</h2>
                    <p class="doc-subtitle">${p.age} years old · ${p.condition}</p>
                    <div style="display:flex;gap:10px;margin-top:8px">
                        ${statusBadge(p.status)}
                        <span class="badge badge-muted">Next Appt: ${p.nextAppt}</span>
                    </div>
                </div>
                <div class="pdh-adherence">
                    <p class="kpi-label">Adherence Rate</p>
                    <p class="kpi-value" style="color:${adherenceColor(p.adherence)};font-size:36px">${p.adherence}%</p>
                    <div class="low-bar-wrap" style="margin-top:6px">
                        <div class="low-bar" style="width:${p.adherence}%;background:${adherenceColor(p.adherence)}"></div>
                    </div>
                </div>
            </div>

            <div class="dash-row">
                <!-- Prescriptions -->
                <div class="doc-card flex-1">
                    <div class="doc-card-title-row">
                        <h2 class="doc-card-title">💊 Prescriptions</h2>
                        <button class="btn-sm" onclick="showDoctorPage('prescriptions')">Manage</button>
                    </div>
                    <div class="rx-list">${rxHtml}</div>
                </div>

                <!-- Quick Actions -->
                <div class="doc-card" style="width:260px">
                    <h2 class="doc-card-title">Quick Actions</h2>
                    <div class="action-list">
                        <button class="action-btn" onclick="showDoctorPage('prescriptions')">📝 New Prescription</button>
                        <button class="action-btn" onclick="showDoctorPage('messages')">💬 Send Message</button>
                        <button class="action-btn" onclick="showDoctorPage('reports')">📊 View Report</button>
                    </div>
                </div>
            </div>
        </div>`;
}

// ── PRESCRIPTIONS ─────────────────────────────────────────────────────────────

function renderDoctorPrescriptions() {
    const rowsHtml = doctorData.prescriptions.map(rx => `
        <tr>
            <td><div class="patient-name-cell">${avatarEl(rx.patientName.split(' ').map(w=>w[0]).join(''), 36)}<span class="pname">${rx.patientName}</span></div></td>
            <td><strong>${rx.medication}</strong></td>
            <td>${rx.dose}</td>
            <td>${rx.frequency}</td>
            <td>${rx.startDate}</td>
            <td>${rx.refillDate}</td>
            <td>${statusBadge(rx.status)}</td>
            <td>
                <div style="display:flex;gap:6px">
                    <button class="btn-sm" onclick="renewPrescription(${rx.id})">Renew</button>
                    <button class="btn-sm btn-sm-danger" onclick="stopPrescription(${rx.id})">Stop</button>
                </div>
            </td>
        </tr>`).join('');

    const refillRows = doctorData.prescriptions.filter(r => r.status === 'refill-due');
    const refillBanner = refillRows.length > 0 ? `
        <div class="doc-alert alert-warning" style="margin-bottom:20px">
            <span class="alert-icon">⚠️</span>
            <span class="alert-msg">${refillRows.length} prescription(s) require renewal — see highlighted rows below.</span>
        </div>` : '';

    document.getElementById('desktop-content').innerHTML = `
        <div class="doc-page">
            <div class="doc-page-header">
                <h1 class="doc-title">Prescriptions</h1>
                <button class="btn-primary" onclick="openNewRxModal()">+ New Prescription</button>
            </div>
            ${refillBanner}
            <div class="doc-card" style="padding:0;overflow:hidden">
                <table class="doc-table">
                    <thead>
                        <tr><th>Patient</th><th>Medication</th><th>Dose</th><th>Frequency</th><th>Start Date</th><th>Refill Date</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        </div>

        <!-- New Prescription Modal -->
        <div id="rx-modal" class="modal-overlay hidden">
            <div class="modal" style="max-width:500px">
                <h2 class="modal-title">New Prescription</h2>
                <div class="form-group">
                    <label class="form-label">Patient</label>
                    <select id="rx-patient" class="form-input">
                        ${doctorData.patients.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Medication Name</label>
                    <input type="text" id="rx-med" class="form-input" placeholder="e.g. Lisinopril">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Dose</label>
                        <input type="text" id="rx-dose" class="form-input" placeholder="e.g. 10mg">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Frequency</label>
                        <select id="rx-freq" class="form-input">
                            <option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>As needed</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea id="rx-notes" class="form-input" rows="3" placeholder="Special instructions..."></textarea>
                </div>
                <div class="modal-buttons">
                    <button class="btn-add" onclick="saveNewRx()">Issue Prescription</button>
                    <button class="btn-cancel" onclick="closeRxModal()">Cancel</button>
                </div>
            </div>
        </div>`;
}

function openNewRxModal() {
    document.getElementById('rx-modal').classList.remove('hidden');
}
function closeRxModal() {
    document.getElementById('rx-modal').classList.add('hidden');
}
function saveNewRx() {
    const patientId  = parseInt(document.getElementById('rx-patient').value);
    const patient    = doctorData.patients.find(p => p.id === patientId);
    const medication = document.getElementById('rx-med').value.trim();
    const dose       = document.getElementById('rx-dose').value.trim();
    const frequency  = document.getElementById('rx-freq').value;

    if (!medication || !dose) { alert('Please fill in medication name and dose.'); return; }

    const today = new Date();
    const refill = new Date(today); refill.setMonth(refill.getMonth() + 3);
    const fmtDate = d => d.toISOString().split('T')[0];

    doctorData.prescriptions.push({
        id: doctorData.prescriptions.length + 1,
        patientId, patientName: patient.name,
        medication, dose, frequency,
        startDate: fmtDate(today), refillDate: fmtDate(refill),
        status: 'active'
    });

    closeRxModal();
    renderDoctorPrescriptions();
}
function renewPrescription(id) {
    const rx = doctorData.prescriptions.find(r => r.id === id);
    if (!rx) return;
    const refill = new Date(); refill.setMonth(refill.getMonth() + 3);
    rx.refillDate = refill.toISOString().split('T')[0];
    rx.status = 'active';
    renderDoctorPrescriptions();
}
function stopPrescription(id) {
    if (!confirm('Are you sure you want to stop this prescription?')) return;
    doctorData.prescriptions = doctorData.prescriptions.filter(r => r.id !== id);
    renderDoctorPrescriptions();
}

// ── REPORTS ───────────────────────────────────────────────────────────────────

function renderDoctorReports() {
    const avgAdherence = Math.round(doctorData.patients.reduce((s, p) => s + p.adherence, 0) / doctorData.patients.length);
    const stable   = doctorData.patients.filter(p => p.status === 'stable').length;
    const atRisk   = doctorData.patients.filter(p => p.status === 'at-risk').length;
    const critical = doctorData.patients.filter(p => p.status === 'critical').length;

    // Bar chart: adherence by patient
    const sorted = [...doctorData.patients].sort((a,b) => b.adherence - a.adherence);
    const barsHtml = sorted.map(p => `
        <div class="report-bar-row">
            <span class="report-bar-label">${p.name.split(' ')[0]}</span>
            <div class="report-bar-track">
                <div class="report-bar-fill" style="width:${p.adherence}%;background:${adherenceColor(p.adherence)}"></div>
            </div>
            <span class="report-bar-pct" style="color:${adherenceColor(p.adherence)}">${p.adherence}%</span>
        </div>`).join('');

    // Breakdown table
    const tableHtml = doctorData.patients.map(p => `
        <tr>
            <td><div class="patient-name-cell">${avatarEl(p.avatar, 32)}<span class="pname">${p.name}</span></div></td>
            <td>${p.condition}</td>
            <td>${statusBadge(p.status)}</td>
            <td><span style="color:${adherenceColor(p.adherence)};font-weight:600">${p.adherence}%</span></td>
            <td>${p.medications}</td>
            <td>${p.lastVisit}</td>
        </tr>`).join('');

    document.getElementById('desktop-content').innerHTML = `
        <div class="doc-page">
            <div class="doc-page-header">
                <h1 class="doc-title">Reports</h1>
                <div style="display:flex;gap:10px">
                    <select class="form-input" style="width:150px">
                        <option>This Month</option><option>Last 3 Months</option><option>This Year</option>
                    </select>
                    <button class="btn-primary">Export PDF</button>
                </div>
            </div>

            <!-- Summary KPIs -->
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-icon" style="background:#d1fae5">📊</div>
                    <div><p class="kpi-label">Avg Adherence</p><p class="kpi-value" style="color:${adherenceColor(avgAdherence)}">${avgAdherence}%</p></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon" style="background:#d1fae5">✅</div>
                    <div><p class="kpi-label">Stable</p><p class="kpi-value" style="color:var(--accent)">${stable}</p></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon" style="background:#fef3c7">⚠️</div>
                    <div><p class="kpi-label">At Risk</p><p class="kpi-value" style="color:#f59e0b">${atRisk}</p></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon" style="background:#fee2e2">🚨</div>
                    <div><p class="kpi-label">Critical</p><p class="kpi-value" style="color:var(--destructive)">${critical}</p></div>
                </div>
            </div>

            <div class="dash-row">
                <!-- Bar chart -->
                <div class="doc-card flex-1">
                    <h2 class="doc-card-title">Adherence by Patient</h2>
                    <div class="report-bars">${barsHtml}</div>
                </div>

                <!-- Status donut -->
                <div class="doc-card" style="width:280px;text-align:center">
                    <h2 class="doc-card-title">Patient Status</h2>
                    <div class="donut-wrap">
                        <svg viewBox="0 0 100 100" class="donut-svg">
                            ${buildDonut([
                                {value: stable,   color:'var(--accent)',      label:'Stable'},
                                {value: atRisk,   color:'#f59e0b',            label:'At Risk'},
                                {value: critical, color:'var(--destructive)', label:'Critical'}
                            ])}
                            <text x="50" y="46" text-anchor="middle" class="donut-center-num">${doctorData.patients.length}</text>
                            <text x="50" y="58" text-anchor="middle" class="donut-center-lbl">Patients</text>
                        </svg>
                    </div>
                    <div class="donut-legend">
                        <div class="dl-item"><span class="dl-dot" style="background:var(--accent)"></span> Stable (${stable})</div>
                        <div class="dl-item"><span class="dl-dot" style="background:#f59e0b"></span> At Risk (${atRisk})</div>
                        <div class="dl-item"><span class="dl-dot" style="background:var(--destructive)"></span> Critical (${critical})</div>
                    </div>
                </div>
            </div>

            <!-- Full patient table -->
            <div class="doc-card" style="padding:0;overflow:hidden">
                <div style="padding:16px 20px 0"><h2 class="doc-card-title">Patient Breakdown</h2></div>
                <table class="doc-table">
                    <thead><tr><th>Patient</th><th>Condition</th><th>Status</th><th>Adherence</th><th>Medications</th><th>Last Visit</th></tr></thead>
                    <tbody>${tableHtml}</tbody>
                </table>
            </div>
        </div>`;
}

function buildDonut(segments) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return '';
    const r = 30, cx = 50, cy = 50, stroke = 12;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    return segments.map(seg => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${stroke}"
            stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset * circumference}"
            transform="rotate(-90 ${cx} ${cy})" />`;
        offset += pct;
        return el;
    }).join('');
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

let activeThreadId = null;

function renderDoctorMessages(threadId) {
    threadId = threadId || (doctorData.messages[0] && doctorData.messages[0].id);
    activeThreadId = threadId;

    const thread = doctorData.messages.find(m => m.id === threadId);
    if (thread) thread.unread = false;

    const listHtml = doctorData.messages.map(m => `
        <div class="msg-thread-item ${m.id === threadId ? 'active' : ''} ${m.unread ? 'unread' : ''}" onclick="renderDoctorMessages(${m.id})">
            ${avatarEl(m.avatar, 40)}
            <div class="msg-thread-info">
                <div class="msg-thread-top">
                    <span class="msg-thread-name">${m.patientName}</span>
                    <span class="msg-thread-time">${m.time}</span>
                </div>
                <span class="msg-thread-preview">${m.preview}</span>
            </div>
            ${m.unread ? '<span class="unread-dot"></span>' : ''}
        </div>`).join('');

    const bubblesHtml = thread ? thread.thread.map(msg => `
        <div class="msg-bubble-wrap ${msg.sender === 'doctor' ? 'bubble-right' : 'bubble-left'}">
            <div class="msg-bubble ${msg.sender === 'doctor' ? 'bubble-doc' : 'bubble-patient'}">
                <p>${msg.text}</p>
                <span class="bubble-time">${msg.time}</span>
            </div>
        </div>`).join('') : '<p class="empty-msg" style="padding:20px">Select a conversation.</p>';

    const threadHeader = thread ? `
        <div class="msg-chat-header">
            ${avatarEl(thread.avatar, 40)}
            <div>
                <span class="msg-chat-name">${thread.patientName}</span>
                <span class="msg-chat-sub">${doctorData.patients.find(p=>p.id===thread.patientId)?.condition || ''}</span>
            </div>
            <button class="btn-sm" style="margin-left:auto" onclick="viewPatient(${thread.patientId})">View Profile</button>
        </div>` : '';

    document.getElementById('desktop-content').innerHTML = `
        <div class="doc-page" style="height:calc(100vh - 120px);display:flex;flex-direction:column">
            <div class="doc-page-header" style="flex-shrink:0">
                <h1 class="doc-title">Messages</h1>
            </div>
            <div class="msg-layout">
                <div class="msg-sidebar">
                    <div class="msg-search-wrap">
                        <input class="msg-search" placeholder="🔍  Search patients..." />
                    </div>
                    <div class="msg-thread-list">${listHtml}</div>
                </div>
                <div class="msg-chat">
                    ${threadHeader}
                    <div class="msg-chat-body">${bubblesHtml}</div>
                    <div class="msg-input-row">
                        <input id="msg-input" class="msg-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendMessage()">
                        <button class="btn-primary" onclick="sendMessage()">Send</button>
                    </div>
                </div>
            </div>
        </div>`;

    // Scroll to bottom
    setTimeout(function() {
        const body = document.querySelector('.msg-chat-body');
        if (body) body.scrollTop = body.scrollHeight;
    }, 50);
}

function sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;

    const thread = doctorData.messages.find(m => m.id === activeThreadId);
    if (!thread) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'});
    thread.thread.push({ sender: 'doctor', text, time: timeStr });
    thread.preview = text;
    thread.time = 'Just now';
    input.value = '';

    renderDoctorMessages(activeThreadId);
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

function renderDoctorSettings() {
    document.getElementById('desktop-content').innerHTML = `
        <div class="doc-page">
            <div class="doc-page-header">
                <h1 class="doc-title">Settings</h1>
            </div>

            <!-- Profile -->
            <div class="doc-card">
                <h2 class="doc-card-title">👤 Profile</h2>
                <div class="settings-profile">
                    ${avatarEl('SC', 64)}
                    <div>
                        <p style="font-weight:600;font-size:18px">${doctorData.doctor.name}</p>
                        <p style="color:var(--muted-foreground)">${doctorData.doctor.specialty}</p>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px">
                    <div class="form-group"><label class="form-label">First Name</label><input class="form-input" value="Sarah"></div>
                    <div class="form-group"><label class="form-label">Last Name</label><input class="form-input" value="Chen"></div>
                    <div class="form-group"><label class="form-label">Specialty</label><input class="form-input" value="Internal Medicine"></div>
                    <div class="form-group"><label class="form-label">License #</label><input class="form-input" value="CA-123456"></div>
                    <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" value="s.chen@medtrack.com"></div>
                    <div class="form-group"><label class="form-label">Phone</label><input class="form-input" value="+1 (555) 000-1234"></div>
                </div>
                <button class="btn-primary" style="margin-top:8px">Save Profile</button>
            </div>

            <!-- Notifications -->
            <div class="doc-card">
                <h2 class="doc-card-title">🔔 Notifications</h2>
                <div class="settings-list">
                    ${[
                        ['Low Adherence Alerts',    'Alert when a patient drops below 70%', true],
                        ['Missed Dose Alerts',       'Alert when patient misses 2+ doses',  true],
                        ['Refill Reminders',         'Remind when prescriptions are due',   true],
                        ['Appointment Reminders',    '24h before each appointment',         true],
                        ['New Patient Messages',     'Notify on incoming messages',         true],
                        ['Weekly Summary Report',    'Email summary every Monday',          false],
                    ].map(([label, desc, checked]) => `
                        <div class="setting-item">
                            <div class="setting-info">
                                <p class="setting-label">${label}</p>
                                <p class="setting-desc">${desc}</p>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" ${checked ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>`).join('')}
                </div>
            </div>

            <!-- Security -->
            <div class="doc-card">
                <h2 class="doc-card-title">🔒 Security</h2>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                    <div class="form-group"><label class="form-label">Current Password</label><input class="form-input" type="password" placeholder="••••••••"></div>
                    <div></div>
                    <div class="form-group"><label class="form-label">New Password</label><input class="form-input" type="password" placeholder="••••••••"></div>
                    <div class="form-group"><label class="form-label">Confirm Password</label><input class="form-input" type="password" placeholder="••••••••"></div>
                </div>
                <button class="btn-primary" style="margin-top:8px">Update Password</button>
            </div>
        </div>`;
}

//Load Reminders Page
function loadRemindersPage() {
      // Update stats
      var totalDoses = appData.medications.length;
      var today = new Date().toISOString().split('T')[0];
      var takenCount = getTakenForDate(today).length;

      document.getElementById('todays-doses').textContent = totalDoses;
      document.getElementById('doses-taken').textContent = takenCount;

      // Load today's schedule
      var listElement = document.getElementById('reminders-list');
      listElement.innerHTML = '';

      appData.medications.forEach(function(med) {
          listElement.innerHTML +=
              '<div class="reminder-card">' +
                  '<div class="reminder-info">' +
                      '<div class="reminder-icon">' + med.name.charAt(0) + '</div>' +
                      '<div class="reminder-details">' +
                          '<span class="reminder-name">' + med.name + '</span>' +
                          '<span class="reminder-dose">' + med.dose + '</span>' +
                      '</div>' +
                  '</div>' +
                  '<span class="reminder-time">' + formatTime(med.time) + '</span>' +
              '</div>';
      });

      // Load appointments
      var appointmentsList = document.getElementById('appointments-list');
      appointmentsList.innerHTML = '';

      appData.appointments.forEach(function(apt) {
          appointmentsList.innerHTML +=
              '<div class="reminder-card">' +
                  '<div class="reminder-info">' +
                      '<div class="reminder-icon">📅</div>' +
                      '<div class="reminder-details">' +
                          '<span class="reminder-name">' + apt.title + '</span>' +
                          '<span class="reminder-dose">' + apt.doctor + '</span>' +
                      '</div>' +
                  '</div>' +
                  '<span class="reminder-time">' + apt.date + '</span>' +
              '</div>';
      });
    }

    var editingMedId = null;

    // Open modal
  document.getElementById('btn-add-med').addEventListener('click', function() {
      document.getElementById('add-med-modal').classList.remove('hidden');
  });

  // Close modal
  document.getElementById('cancel-modal').addEventListener('click', function() {
      document.getElementById('add-med-modal').classList.add('hidden');
  });

  // Submittion form
  document.getElementById('add-med-form').addEventListener('submit', function(e) {
      e.preventDefault();

    var name = document.getElementById('med-name').value;
    var dose = document.getElementById('med-dose').value;
    var frequency = document.getElementById('med-frequency').value;
    var time = document.getElementById('med-time').value;

      if (editingMedId !== null) {
          var index = appData.medications.findIndex(function(m) { return m.id === editingMedId; });
          appData.medications[index].name = name;
          appData.medications[index].dose = dose;
          appData.medications[index].frequency = frequency;
          appData.medications[index].time = time;
          editingMedId = null;
      } else {
          appData.medications.push({
              id: appData.medications.length + 1,
              name: name,
              dose: dose,
              frequency: frequency,
              time: time
          });
      }

      saveData();
      document.getElementById('add-med-modal').classList.add('hidden');
      document.getElementById('add-med-form').reset();
      loadAllMedications();
  });

// Delete medication
function deleteMedication(id) {
    appData.medications = appData.medications.filter(function(med) {
        return med.id !== id;
    });
    saveData();
    loadAllMedications();
}

  // Edit medication

  function editMedication(id) {
      var med = appData.medications.find(function(m) { return m.id === id; });
      if (!med) return;

      editingMedId = id;
      document.getElementById('med-name').value = med.name;
      document.getElementById('med-dose').value = med.dose;
      document.getElementById('med-frequency').value = med.frequency;
      document.getElementById('med-time').value = med.time;
      document.getElementById('add-med-modal').classList.remove('hidden');
  }

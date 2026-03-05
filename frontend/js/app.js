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

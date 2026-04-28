// MedTrack Data Layer

let appData = {
    user:          null,
    patientId:     null,
    medications:   [],
    prescriptions: [],
    taken:         [],
    appointments:  []
};

async function initAppData() {
    const user = getUser();
    if (!user) return;

    appData.user = user;

    try {
        if (user.role === 'patient') {
            const patient        = await apiGetPatient(user.id);
            appData.patientId    = patient.id;
            appData.medications    = patient.medications || [];
            appData.appointments   = await apiGetAppointments(patient.id).catch(() => []);
            appData.prescriptions  = await apiGetPrescriptions(patient.id).catch(() => []);

            // Build taken records from medication logs
            appData.taken = [];
            for (const med of appData.medications) {
                const logs = await apiGetMedicationLogs(med.id);
                logs.forEach(function(log) {
                    appData.taken.push({
                        id:     log.id,
                        visaId: med.id,
                        date:   log.taken_date,
                        time:   log.taken_time
                    });
                });
            }

            loadPatientDashboard();

        } else if (user.role === 'doctor') {
              // Doctor data is loaded on demand per page, nothing to pre-load
              showDoctorPage('dashboard');
          } else if (user.role === 'admin') {
              showAdminPage('dashboard');
          }

    } catch (err) {
        console.error('Failed to load app data:', err.message);
    }
}

function isTakenToday(medId) {
    const today = new Date().toISOString().split('T')[0];
    return appData.taken.some(function(r) { return r.visaId === medId && r.date === today; });
}

async function recordTaken(medId) {
    try {
        await apiLogTaken(medId);
        const now = new Date();
        appData.taken.push({
            id:     Date.now(),
            visaId: medId,
            date:   now.toISOString().split('T')[0],
            time:   now.toTimeString().split(' ')[0]
        });
    } catch (err) {
        console.error('Failed to log medication:', err.message);
    }
}

function getTakenForDate(dateStr) {
    return appData.taken.filter(function(r) { return r.date === dateStr; });
}

function calculateAdherence(startDate, endDate) {
    let total = 0, taken = 0;
    const cur = new Date(startDate);
    const end = new Date(endDate);
    while (cur <= end) {
        const dateStr    = formatDateStr(cur);
        const takenToday = getTakenForDate(dateStr);
        appData.medications.forEach(function(med) {
            total++;
            if (takenToday.some(function(t) { return t.visaId === med.id; })) taken++;
        });
        cur.setDate(cur.getDate() + 1);
    }
    return total === 0 ? 0 : Math.round((taken / total) * 100);
}

function saveData() {}

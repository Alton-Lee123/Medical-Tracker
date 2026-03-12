// MedTrack Data Layer

let appData = {
    user:         null,
    patientId:    null,
    medications:  [],
    taken:        [],
    refills:      [],
    appointments: []
};

async function initAppData() {
    const user = getUser();
    if (!user) return;

    appData.user = user;

    try {
        if (user.role === 'patient') {
            // Look up patient record by user_id
            const patient = await apiGetPatient(user.id);

            appData.patientId   = patient.id;
            appData.medications = patient.medications || [];

            const appointments   = await apiGetAppointments(patient.id);
            appData.appointments = appointments || [];

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

            // Reload the dashboard now that data is ready
            loadPatientDashboard();
        }
    } catch (err) {
        console.error('Failed to load app data:', err.message);
    }
}

function isTakenToday(medId) {
    const today = new Date().toISOString().split('T')[0];
    return appData.taken.some(function(record) {
        return record.visaId === medId && record.date === today;
    });
}

async function recordTaken(medId) {
    try {
        await apiLogTaken(medId);
        const now = new Date();
        appData.taken.push({
            id:     appData.taken.length + 1,
            visaId: medId,
            date:   now.toISOString().split('T')[0],
            time:   now.toTimeString().split(' ')[0]
        });
    } catch (err) {
        console.error('Failed to log medication:', err.message);
    }
}

function getTakenForDate(dateStr) {
    return appData.taken.filter(function(record) {
        return record.date === dateStr;
    });
}

function calculateAdherence(startDate, endDate) {
    let totalDoses = 0;
    let takenDoses = 0;

    let current = new Date(startDate);
    const end   = new Date(endDate);

    while (current <= end) {
        const dateStr    = current.toISOString().split('T')[0];
        const takenToday = getTakenForDate(dateStr);

        appData.medications.forEach(function(med) {
            totalDoses++;
            if (takenToday.some(function(t) { return t.visaId === med.id; })) {
                takenDoses++;
            }
        });

        current.setDate(current.getDate() + 1);
    }

    if (totalDoses === 0) return 0;
    return Math.round((takenDoses / totalDoses) * 100);
}

function saveData() {}

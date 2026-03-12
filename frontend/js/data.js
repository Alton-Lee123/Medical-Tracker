// Mock Data for MedTrack (localStorage version)

  // Load data from localStorage or use defaults
  function loadData() {
      const saved = localStorage.getItem('medtrack_data');
      if (saved) {
          return JSON.parse(saved);
      }

      // Default data (matches database structure)
      return {
          user: {
              id: 1,
              name: 'John',
              surname: 'Smith',
              role: 'patient'
          },
          medications: [
              {
                  id: 1,
                  name: 'Lisinopril',
                  dose: '10mg',
                  frequency: 'Once daily',
                  time: '08:00'
              },
              {
                  id: 2,
                  name: 'Metformin',
                  dose: '500mg',
                  frequency: 'Twice daily',
                  time: '08:00'
              },
              {
                  id: 3,
                  name: 'Metformin',
                  dose: '500mg',
                  frequency: 'Twice daily',
                  time: '20:00'
              },
              {
                  id: 4,
                  name: 'Atorvastatin',
                  dose: '20mg',
                  frequency: 'Once daily',
                  time: '21:00'
              }
          ],
          taken: [],
          refills: [
              {
                  id: 1,
                  medicationName: 'Metformin',
                  dueDate: '2026-03-10',
                  daysLeft: 8
              }
          ],
          appointments: [
              {
                  id: 1,
                  title: 'Doctor Checkup',
                  doctor: 'Dr. Smith',
                  date: '2026-03-15',
                  time: '10:00'
              }
          ]
      };
  }

  // Save data to localStorage
  function saveData() {
      localStorage.setItem('medtrack_data', JSON.stringify(appData));
  }

  // Initialize app data
  let appData = loadData();

  // ── Doctor Mock Data ──────────────────────────────────────────────────────

  const doctorData = {
      doctor: { name: 'Dr. Sarah Chen', specialty: 'Internal Medicine', patients: 24 },

      patients: [
          { id: 1, name: 'John Smith',    age: 58, condition: 'Hypertension, T2 Diabetes', adherence: 82, lastVisit: '2026-02-28', status: 'stable',   avatar: 'JS', medications: 4, nextAppt: '2026-03-15' },
          { id: 2, name: 'Maria Garcia',  age: 45, condition: 'Hyperlipidemia',             adherence: 95, lastVisit: '2026-03-01', status: 'stable',   avatar: 'MG', medications: 2, nextAppt: '2026-04-10' },
          { id: 3, name: 'Robert Lee',    age: 67, condition: 'COPD, Hypertension',         adherence: 60, lastVisit: '2026-02-15', status: 'at-risk',  avatar: 'RL', medications: 5, nextAppt: '2026-03-18' },
          { id: 4, name: 'Emma Johnson',  age: 34, condition: 'Asthma',                     adherence: 91, lastVisit: '2026-03-05', status: 'stable',   avatar: 'EJ', medications: 2, nextAppt: '2026-05-02' },
          { id: 5, name: 'David Kim',     age: 72, condition: 'Atrial Fibrillation, CHF',   adherence: 48, lastVisit: '2026-02-10', status: 'critical', avatar: 'DK', medications: 7, nextAppt: '2026-03-12' },
          { id: 6, name: 'Linda Torres',  age: 51, condition: 'T2 Diabetes',                adherence: 76, lastVisit: '2026-03-03', status: 'stable',   avatar: 'LT', medications: 3, nextAppt: '2026-03-25' },
          { id: 7, name: 'James Wilson',  age: 63, condition: 'Hypertension',               adherence: 88, lastVisit: '2026-02-20', status: 'stable',   avatar: 'JW', medications: 2, nextAppt: '2026-04-15' },
          { id: 8, name: 'Susan Brown',   age: 55, condition: 'Hypothyroidism, Depression', adherence: 55, lastVisit: '2026-02-08', status: 'at-risk',  avatar: 'SB', medications: 4, nextAppt: '2026-03-20' },
      ],

      prescriptions: [
          { id: 1, patientId: 1, patientName: 'John Smith',   medication: 'Lisinopril',   dose: '10mg',  frequency: 'Once daily',  startDate: '2025-06-01', refillDate: '2026-03-10', status: 'active' },
          { id: 2, patientId: 1, patientName: 'John Smith',   medication: 'Metformin',    dose: '500mg', frequency: 'Twice daily', startDate: '2025-06-01', refillDate: '2026-03-10', status: 'active' },
          { id: 3, patientId: 1, patientName: 'John Smith',   medication: 'Atorvastatin', dose: '20mg',  frequency: 'Once daily',  startDate: '2025-06-01', refillDate: '2026-04-01', status: 'active' },
          { id: 4, patientId: 2, patientName: 'Maria Garcia', medication: 'Rosuvastatin', dose: '10mg',  frequency: 'Once daily',  startDate: '2025-09-15', refillDate: '2026-03-15', status: 'active' },
          { id: 5, patientId: 3, patientName: 'Robert Lee',   medication: 'Tiotropium',   dose: '18mcg', frequency: 'Once daily',  startDate: '2024-11-01', refillDate: '2026-03-05', status: 'refill-due' },
          { id: 6, patientId: 5, patientName: 'David Kim',    medication: 'Warfarin',     dose: '5mg',   frequency: 'Once daily',  startDate: '2025-01-20', refillDate: '2026-03-08', status: 'refill-due' },
          { id: 7, patientId: 5, patientName: 'David Kim',    medication: 'Furosemide',   dose: '40mg',  frequency: 'Twice daily', startDate: '2025-01-20', refillDate: '2026-03-08', status: 'refill-due' },
          { id: 8, patientId: 6, patientName: 'Linda Torres', medication: 'Metformin',    dose: '1000mg','frequency': 'Twice daily', startDate: '2025-07-10', refillDate: '2026-04-10', status: 'active' },
      ],

      messages: [
          { id: 1, patientId: 3, patientName: 'Robert Lee',   avatar: 'RL', time: '9:14 AM',  preview: 'I\'ve been feeling more short of breath lately...', unread: true,  thread: [
              { sender: 'patient', text: 'Good morning Dr. Chen, I\'ve been feeling more short of breath lately, especially in the mornings. Should I be concerned?', time: '9:14 AM' },
          ]},
          { id: 2, patientId: 5, patientName: 'David Kim',    avatar: 'DK', time: 'Yesterday', preview: 'Thank you for the prescription renewal...', unread: false, thread: [
              { sender: 'doctor',  text: 'Hi David, I\'ve renewed your Warfarin prescription. Please remember to get your INR checked this week.', time: 'Yesterday 2:00 PM' },
              { sender: 'patient', text: 'Thank you for the prescription renewal. I will go to the lab tomorrow morning.', time: 'Yesterday 4:30 PM' },
          ]},
          { id: 3, patientId: 1, patientName: 'John Smith',   avatar: 'JS', time: 'Mar 8',    preview: 'My blood sugar readings have been high...', unread: false, thread: [
              { sender: 'patient', text: 'Dr. Chen, my blood sugar readings have been running higher than usual this week, around 180-200 fasting. Is this something we need to address?', time: 'Mar 8 10:00 AM' },
              { sender: 'doctor',  text: 'Thank you for letting me know, John. Let\'s increase your Metformin to 1000mg twice daily temporarily. Please monitor for a week and report back.', time: 'Mar 8 11:30 AM' },
          ]},
          { id: 4, patientId: 8, patientName: 'Susan Brown',  avatar: 'SB', time: 'Mar 6',    preview: 'I forgot to take my medication for two days...', unread: true,  thread: [
              { sender: 'patient', text: 'Hi, I forgot to take my medication for two days while traveling. What should I do?', time: 'Mar 6 3:00 PM' },
          ]},
      ],

      appointments: [
          { id: 1, patientId: 5, patientName: 'David Kim',   time: '9:00 AM',  type: 'Follow-up',      date: '2026-03-11', avatar: 'DK' },
          { id: 2, patientId: 3, patientName: 'Robert Lee',  time: '10:30 AM', type: 'Check-up',        date: '2026-03-11', avatar: 'RL' },
          { id: 3, patientId: 6, patientName: 'Linda Torres',time: '2:00 PM',  type: 'Diabetes Review', date: '2026-03-11', avatar: 'LT' },
          { id: 4, patientId: 1, patientName: 'John Smith',  time: '10:00 AM', type: 'Check-up',        date: '2026-03-15', avatar: 'JS' },
      ],

      alerts: [
          { type: 'critical', message: 'David Kim missed 3 doses of Warfarin this week',         patientId: 5 },
          { type: 'warning',  message: 'Robert Lee adherence dropped below 65% — check in due',  patientId: 3 },
          { type: 'warning',  message: 'Susan Brown has not logged medications in 2 days',        patientId: 8 },
          { type: 'info',     message: 'Refill requests pending for 3 patients',                  patientId: null },
      ]
  };

  // Helper: Check if medication is taken today
  function isTakenToday(medId) {
      const today = new Date().toISOString().split('T')[0];
      return appData.taken.some(function(record) {
          return record.visaId === medId && record.date === today;
      });
  }

  // Helper: Mark medication as taken
  function recordTaken(medId) {
      const now = new Date();
      const record = {
          id: appData.taken.length + 1,
          visaId: medId,
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0]
      };
      appData.taken.push(record);
      saveData();
  }

  // Helper: Get taken records for a specific date
  function getTakenForDate(dateStr) {
      return appData.taken.filter(function(record) {
          return record.date === dateStr;
      });
  }

  // Helper: Calculate adherence for date range
  function calculateAdherence(startDate, endDate) {
      let totalDoses = 0;
      let takenDoses = 0;

      let current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
          const dateStr = current.toISOString().split('T')[0];
          const takenToday = getTakenForDate(dateStr);

          appData.medications.forEach(function(med) {
              totalDoses++;
              if (takenToday.some(function(t) { return t.visaId ===
  med.id; })) {
                  takenDoses++;
              }
          });

          current.setDate(current.getDate() + 1);
      }

      if (totalDoses === 0) return 0;
      return Math.round((takenDoses / totalDoses) * 100);
  }


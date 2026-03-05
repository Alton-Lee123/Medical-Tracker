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


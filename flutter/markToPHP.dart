await http.post(
  Uri.parse("https://medicaltracker.com/api/mark_taken.php"),
  body: {
    "patient_id": "1",
    "medication_id": "5",
    "status": "taken"
  },
);
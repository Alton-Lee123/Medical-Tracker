final response = await http.get(
  Uri.parse("https://medicaltracker.com/api/get_medications.php?patient_id=1")
);

final data = jsonDecode(response.body);
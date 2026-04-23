import 'dart:convert';
import 'package:http/http.dart' as http;

const String apiBaseUrl = 'http://192.168.1.166/medtrack/backend';

class ApiService {
  const ApiService();

  Future<List<dynamic>> getMedications({
    required String token,
    required int userId,
  }) async {
    final url = Uri.parse('$apiBaseUrl/api/medications/$userId');

    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    print("MEDS URL: $url");
    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");

    final data = response.body.isNotEmpty ? jsonDecode(response.body) : [];

    if (response.statusCode >= 400) {
      throw Exception(
        data is Map ? (data['error'] ?? 'Failed to load medications') : 'Failed to load medications',
      );
    }

    if (data is List) return data;
    if (data is Map && data['data'] is List) return data['data'];

    throw Exception('Unexpected medications response');
  }
}
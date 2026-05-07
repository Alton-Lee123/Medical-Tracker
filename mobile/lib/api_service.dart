import 'dart:convert';
import 'package:http/http.dart' as http;

const String apiBaseUrl = 'http://192.168.1.166/medtrack/backend';


class MessageThreadsResult {
  const MessageThreadsResult({
    required this.rows,
    required this.activeUserId,
    required this.attempts,
  });

  final List<dynamic> rows;
  final int activeUserId;
  final List<String> attempts;
}

class ApiService {
  const ApiService();

  // ── helpers ──────────────────────────────────────────────────────────────────

  Map<String, String> _headers(String token) => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  Future<dynamic> _get(String path, String token) async {
    final res = await http.get(Uri.parse('$apiBaseUrl$path'), headers: _headers(token));
    final data = res.body.isNotEmpty ? jsonDecode(res.body) : {};
    if (res.statusCode >= 400) throw Exception(data is Map ? (data['error'] ?? 'Request failed') : 'Request failed');
    return data;
  }

  Future<dynamic> _post(String path, String token, Map<String, dynamic> body) async {
    final res = await http.post(Uri.parse('$apiBaseUrl$path'), headers: _headers(token), body: jsonEncode(body));
    final data = res.body.isNotEmpty ? jsonDecode(res.body) : {};
    if (res.statusCode >= 400) throw Exception(data is Map ? (data['error'] ?? 'Request failed') : 'Request failed');
    return data;
  }

  Future<dynamic> _put(String path, String token, Map<String, dynamic> body) async {
    final res = await http.put(Uri.parse('$apiBaseUrl$path'), headers: _headers(token), body: jsonEncode(body));
    final data = res.body.isNotEmpty ? jsonDecode(res.body) : {};
    if (res.statusCode >= 400) throw Exception(data is Map ? (data['error'] ?? 'Request failed') : 'Request failed');
    return data;
  }

  // ── patient profile ───────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getPatient(String token, int userId) async {
    final data = await _get('/api/patients/$userId', token);
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> updateProfile(String token, int userId, Map<String, dynamic> body) async {
    await _put('/api/patients/$userId', token, body);
  }

  // ── medications ───────────────────────────────────────────────────────────────

  Future<List<dynamic>> getMedications({required String token, required int userId}) async {
    final data = await _get('/api/medications/$userId', token);
    if (data is List) return data;
    throw Exception('Unexpected medications response');
  }

  Future<void> logTaken(String token, int medicationId) async {
    await _post('/api/medications/$medicationId/taken', token, {});
  }

  Future<List<dynamic>> getMedicationLogs(String token, int medicationId) async {
    final data = await _get('/api/medications/$medicationId/logs', token);
    if (data is List) return data;
    return [];
  }

  Future<void> addMedication(String token, int patientId, String name, String dose, String frequency, String time) async {
    await _post('/api/medications', token, {
      'patient_id': patientId,
      'name': name,
      'dose': dose,
      'frequency': frequency,
      'time': time,
    });
  }

  Future<void> deleteMedication(String token, int id) async {
    final res = await http.delete(Uri.parse('$apiBaseUrl/api/medications/$id'), headers: _headers(token));
    if (res.statusCode >= 400) throw Exception('Delete failed');
  }

  // ── appointments ──────────────────────────────────────────────────────────────

  Future<List<dynamic>> getAppointments(String token, int patientId) async {
    final data = await _get('/api/appointments/$patientId', token);
    if (data is List) return data;
    return [];
  }

  // ── prescriptions ─────────────────────────────────────────────────────────────

  Future<List<dynamic>> getPrescriptions(String token, int patientId) async {
    final data = await _get('/api/prescriptions/$patientId', token);
    if (data is List) return data;
    return [];
  }

  // ── messages ──────────────────────────────────────────────────────────────────

  Future<List<dynamic>> getThreads(String token, int userId) async {
    final result = await getThreadsDebug(token, [userId]);
    return result.rows;
  }

  Future<MessageThreadsResult> getThreadsDebug(String token, List<int> userIds) async {
    final attempts = <String>[];
    final seen = <int>{};
    final ids = userIds.where((id) => id > 0 && seen.add(id)).toList();

    for (final userId in ids) {
      final paths = <String>[
        // Most likely REST patterns first.
        '/api/messages/$userId',
        '/api/messages/threads/$userId',
        '/api/messages/user/$userId',
        '/api/messages/thread/$userId',
        '/api/messages?user_id=$userId',
        '/api/messages?userId=$userId',
        '/api/messages/threads?user_id=$userId',
        '/api/messages/threads?userId=$userId',
        '/api/messages/getThreads/$userId',
      ];

      for (final path in paths) {
        final uri = Uri.parse('$apiBaseUrl$path');
        try {
          final res = await http.get(uri, headers: _headers(token));
          final body = res.body.trim();
          dynamic data;
          try {
            data = body.isNotEmpty ? jsonDecode(body) : [];
          } catch (_) {
            data = body;
          }

          final rows = _extractList(data);
          attempts.add('GET $path → ${res.statusCode}, rows=${rows.length}, body=${_shortBody(body)}');

          if (res.statusCode < 400 && rows.isNotEmpty) {
            return MessageThreadsResult(rows: rows, activeUserId: userId, attempts: attempts);
          }
        } catch (e) {
          attempts.add('GET $path → error: $e');
        }
      }
    }

    return MessageThreadsResult(
      rows: const [],
      activeUserId: ids.isEmpty ? 0 : ids.first,
      attempts: attempts,
    );
  }

  String _shortBody(String body) {
    final oneLine = body.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (oneLine.length <= 220) return oneLine;
    return '${oneLine.substring(0, 220)}…';
  }

  List<dynamic> _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map) {
      for (final key in const ['messages', 'threads', 'data', 'rows', 'results']) {
        final value = data[key];
        if (value is List) return value;
        if (value is Map) {
          final nested = _extractList(value);
          if (nested.isNotEmpty) return nested;
        }
      }

      // Some APIs return a single message object rather than an array.
      if (data.containsKey('sender_id') || data.containsKey('receiver_id') || data.containsKey('body')) {
        return [data];
      }
    }
    return [];
  }

  Future<void> sendMessage(String token, int senderId, int receiverId, String body) async {
    await _post('/api/messages', token, {
      'sender_id': senderId,
      'receiver_id': receiverId,
      'body': body,
    });
  }
}
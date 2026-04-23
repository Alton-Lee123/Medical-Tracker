import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/patient_shell.dart';

const String apiBaseUrl = 'http://192.168.1.166/medtrack/backend';

void main() {
  runApp(const MedTrackApp());
}

class MedTrackApp extends StatelessWidget {
  const MedTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MedTrack',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2C7A9B)),
        useMaterial3: true,
      ),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _loading = true;
  String? _token;
  String? _name;
  String? _role;
  int? _userId;
  
  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _token = prefs.getString('medtrack_token');
      _name = prefs.getString('medtrack_name');
      _role = prefs.getString('medtrack_role');
      _userId = prefs.getInt('medtrack_user_id');
      _loading = false;
    });
  }

    Future<void> _onLoggedIn({
    required String token,
    required String name,
    required String role,
    required int userId,
  }) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString('medtrack_token', token);
    await prefs.setString('medtrack_name', name);
    await prefs.setString('medtrack_role', role);
    await prefs.setInt('medtrack_user_id', userId);

    setState(() {
      _token = token;
      _name = name;
      _role = role;
      _userId = userId;
    });
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('medtrack_token');
    await prefs.remove('medtrack_name');
    await prefs.remove('medtrack_role');

    setState(() {
      _token = null;
      _name = null;
      _role = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_token == null) {
      return LoginPage(onLoggedIn: _onLoggedIn);
    }

    if ((_role ?? '').toLowerCase() == 'patient') {
      return PatientShell(
        name: _name ?? 'User',
        token: _token!,
        userId: _userId!,
        onLogout: _logout,
      );
    }

    return HomePage(
      name: _name ?? 'User',
      role: _role ?? 'unknown',
      onLogout: _logout,
    );
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.onLoggedIn});

final Future<void> Function({
  required String token,
  required String name,
  required String role,
  required int userId,
}) onLoggedIn;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
        }),
      );

      final raw = response.body;
      final data = raw.isNotEmpty ? jsonDecode(raw) : <String, dynamic>{};



      if (response.statusCode >= 400) {
        throw Exception(data['error'] ?? 'Login failed');
      }

      final token = data['token']?.toString();
      final user = data['user'] is Map<String, dynamic>
          ? data['user'] as Map<String, dynamic>
          : data;

      final userId = int.tryParse(
        (user['id'] ?? data['id'] ?? '').toString(),
      );

      if (userId == null) {
        throw Exception('Missing user id in login response');
      }

      if (token == null) {
        throw Exception('Missing token in login response');
      }

      final firstName = (user['name'] ?? '').toString();
      final surname = (user['surname'] ?? '').toString();
      final role = (user['role'] ?? data['role'] ?? 'unknown').toString();

      final name = '$firstName $surname'.trim().isEmpty
          ? 'User'
          : '$firstName $surname'.trim();

      await widget.onLoggedIn(
        token: token,
        name: name,
        role: role,
          userId: userId,
      );
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'MedTrack',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text('Sign in to continue'),
                      const SizedBox(height: 24),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (_error != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            _error!,
                            style: const TextStyle(color: Colors.red),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _loading ? null : _login,
                          child: _loading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text('Login'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({
    super.key,
    required this.name,
    required this.role,
    required this.onLogout,
  });

  final String name;
  final String role;
  final Future<void> Function() onLogout;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MedTrack'),
        actions: [
          IconButton(
            onPressed: () async => onLogout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome, $name',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Text('Role: $role', style: const TextStyle(fontSize: 18)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
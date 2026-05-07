import 'package:flutter/material.dart';
import 'package:mobile/api_service.dart';
import 'package:mobile/patient_page.dart';

String _formatTime(String raw) {
  if (raw.isEmpty) return '';
  final parts = raw.split(':');
  if (parts.length < 2) return raw;
  final h = int.tryParse(parts[0]) ?? 0;
  final m = parts[1];
  final ampm = h >= 12 ? 'PM' : 'AM';
  final h12 = h % 12 == 0 ? 12 : h % 12;
  return '${h12}:${m} ${ampm}';
}

class PatientShell extends StatefulWidget {
  const PatientShell({
    super.key,
    required this.name,
    required this.token,
    required this.userId,
    required this.onLogout,
  });

  final String name;
  final String token;
  final int userId;
  final Future<void> Function() onLogout;
  @override
  State<PatientShell> createState() => _PatientShellState();
}

class _PatientShellState extends State<PatientShell> {
  int _currentIndex = 0;

  static const _primary = Color(0xFF2C7A9B);
  static const _secondary = Color(0xFFE0F2F7);
  static const _background = Color(0xFFF8FAFB);
  static const _border = Color(0x1F2C7A9B);

  late final List<Widget> _pages = [
    PatientDashboardPage(
      name: widget.name,
      token: widget.token,
      userId: widget.userId,
    ),
    PatientMedicationsPage(
      token: widget.token,
      userId: widget.userId,
    ),
    PatientHistoryPage(
      token: widget.token,
      userId: widget.userId,
    ),
    PatientRemindersPage(
      token: widget.token,
      userId: widget.userId,
    ),
    PatientMessagesPage(
      token: widget.token,
      userId: widget.userId,
    ),
    const PatientSettingsPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.white,
        titleSpacing: 20,
        title: const Row(
          children: [
            Text('💊', style: TextStyle(fontSize: 22)),
            SizedBox(width: 8),
            Text(
              'MedTrack',
              style: TextStyle(
                color: _primary,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: IconButton(
              onPressed: () async => widget.onLogout(),
              style: IconButton.styleFrom(backgroundColor: _secondary),
              icon: const Text('👤', style: TextStyle(fontSize: 18)),
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: _border),
        ),
      ),
      body: SafeArea(child: _pages[_currentIndex]),
      bottomNavigationBar: NavigationBar(
        height: 72,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        indicatorColor: _secondary,
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.medication_outlined), selectedIcon: Icon(Icons.medication), label: 'Meds'),
          NavigationDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month), label: 'History'),
          NavigationDestination(icon: Icon(Icons.notifications_none), selectedIcon: Icon(Icons.notifications), label: 'Reminders'),
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), selectedIcon: Icon(Icons.chat_bubble), label: 'Messages'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}

class PatientRemindersPage extends StatefulWidget {
  const PatientRemindersPage({
    super.key,
    required this.token,
    required this.userId,
  });

  final String token;
  final int userId;

  @override
  State<PatientRemindersPage> createState() => _PatientRemindersPageState();
}

class _PatientRemindersPageState extends State<PatientRemindersPage> {
  static const _primary = Color(0xFF2C7A9B);
  static const _secondary = Color(0xFFE0F2F7);
  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);
  static const _accent = Color(0xFF4DB6AC);
  static const _warning = Color(0xFFF59E0B);
  static const _muted = Color(0xFFE8F4F8);

  final _api = const ApiService();
  bool _loading = true;
  String? _error;
  List<dynamic> _meds = [];
  List<dynamic> _prescriptions = [];
  List<dynamic> _appointments = [];
  Set<int> _takenTodayIds = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final patient = await _api.getPatient(widget.token, widget.userId);
      final meds = List<dynamic>.from(patient['medications'] ?? []);
      final patientId = (patient['id'] as int?) ?? widget.userId;

      final today = DateTime.now().toIso8601String().substring(0, 10);
      final Set<int> takenToday = {};
      for (final med in meds) {
        final medId = med['id'] as int;
        final logs = await _api.getMedicationLogs(widget.token, medId);
        if (logs.any((l) => l['taken_date'] == today)) takenToday.add(medId);
      }

      final rxs = await _api.getPrescriptions(widget.token, patientId);
      final apts = await _api.getAppointments(widget.token, patientId);
      final now = DateTime.now();
      final upcomingApts = apts.where((a) {
        try {
          final d = a['date']?.toString() ?? '';
          final t = a['time']?.toString() ?? '00:00:00';
          return DateTime.parse('${d}T${t}').isAfter(now);
        } catch (_) { return false; }
      }).toList();

      if (!mounted) return;
      setState(() {
        _meds = meds;
        _prescriptions = rxs;
        _appointments = upcomingApts;
        _takenTodayIds = takenToday;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  String _rxStatusLabel(String? s) {
    if (s == 'active') return 'Active';
    if (s == 'refill-due') return 'Refill Due';
    return s ?? '';
  }

  Color _rxStatusColor(String? s) {
    if (s == 'active') return _accent;
    if (s == 'refill-due') return _warning;
    return _mutedForeground;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          const Text('Reminders', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground)),
          const SizedBox(height: 6),
          const Text('Stay on track with your medication schedule', style: TextStyle(fontSize: 14, color: _mutedForeground)),
          const SizedBox(height: 20),
          if (_loading)
            const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()))
          else if (_error != null)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0x1F2C7A9B))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_error!, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 12),
                ElevatedButton(onPressed: _load, child: const Text('Try again')),
              ]),
            )
          else ...[
            Row(children: [
              Expanded(child: _StatCard(icon: '💊', label: "Today's Doses", value: '${_meds.length}')),
              const SizedBox(width: 15),
              Expanded(child: _StatCard(icon: '✓', label: 'Taken', value: '${_takenTodayIds.length}')),
            ]),
            const SizedBox(height: 20),

            // Today's Schedule
            _ReminderSection(
              title: "Today's Schedule",
              empty: _meds.isEmpty ? 'No medications scheduled.' : null,
              children: _meds.map<Widget>((med) {
                final medId = med['id'] as int;
                final taken = _takenTodayIds.contains(medId);
                return _ReminderRow(
                  icon: Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(color: taken ? _accent : _secondary, shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: Text((med['name'] ?? '?').toString()[0].toUpperCase(),
                        style: TextStyle(color: taken ? Colors.white : _primary, fontWeight: FontWeight.w700)),
                  ),
                  title: (med['name'] ?? '').toString(),
                  subtitle: '${med["dose"] ?? ""} · ${med["frequency"] ?? ""}',
                  trailing: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text(_formatTime((med['time'] ?? '').toString()),
                        style: const TextStyle(fontWeight: FontWeight.w600, color: _primary)),
                    if (taken) const Text('✓ Taken', style: TextStyle(fontSize: 11, color: _accent, fontWeight: FontWeight.w600)),
                  ]),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Prescriptions
            _ReminderSection(
              title: '💊 My Prescriptions',
              empty: _prescriptions.isEmpty ? 'No prescriptions on file.' : null,
              children: _prescriptions.map<Widget>((rx) {
                final status = rx['status']?.toString();
                return _ReminderRow(
                  icon: Container(
                    width: 40, height: 40,
                    decoration: const BoxDecoration(color: _primary, shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: Text((rx['medication'] ?? '?').toString()[0].toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                  ),
                  title: '${rx["medication"] ?? ""} ${rx["dose"] ?? ""}',
                  subtitle: [
                    rx['frequency']?.toString(),
                    rx['doctor_name'] != null ? 'Dr. ${rx["doctor_name"]} ${rx["doctor_surname"] ?? ""}' : null,
                  ].where((s) => s != null && s.trim().isNotEmpty).join(' · '),
                  subtitleExtra: rx['refill_date'] != null ? 'Refill: ${rx["refill_date"]}' : null,
                  trailing: Text(_rxStatusLabel(status),
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _rxStatusColor(status))),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Appointments
            _ReminderSection(
              title: 'Appointments',
              empty: _appointments.isEmpty ? 'No upcoming appointments.' : null,
              children: _appointments.map<Widget>((apt) => _ReminderRow(
                icon: Container(
                  width: 40, height: 40,
                  decoration: const BoxDecoration(color: _secondary, shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: const Text('📅', style: TextStyle(fontSize: 18)),
                ),
                title: (apt['title'] ?? '').toString(),
                subtitle: [
                  apt['date']?.toString(),
                  apt['time'] != null ? 'at ${_formatTime(apt["time"].toString())}' : null,
                  apt['doctor_name'] != null ? 'Dr. ${apt["doctor_name"]}' : null,
                ].where((s) => s != null && s.trim().isNotEmpty).join(' · '),
                trailing: const Text('Upcoming', style: TextStyle(fontSize: 11, color: _primary, fontWeight: FontWeight.w600)),
              )).toList(),
            ),
            const SizedBox(height: 16),

            // Notification Settings
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0x1F2C7A9B))),
              child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Notification Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: _foreground)),
                SizedBox(height: 15),
                _ToggleRow(title: 'Medication Reminders', subtitle: 'Get notified before each dose'),
                SizedBox(height: 12),
                _ToggleRow(title: 'Missed Dose Alerts', subtitle: 'Alert when a dose is missed'),
              ]),
            ),
          ],
        ],
      ),
    );
  }
}

class _ReminderSection extends StatelessWidget {
  const _ReminderSection({required this.title, required this.children, this.empty});
  final String title;
  final List<Widget> children;
  final String? empty;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0x1F2C7A9B))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF1E3A4C))),
        const SizedBox(height: 15),
        if (empty != null)
          Text(empty!, style: const TextStyle(color: Color(0xFF5A7C8D)))
        else
          ...children,
      ]),
    );
  }
}

class _ReminderRow extends StatelessWidget {
  const _ReminderRow({required this.icon, required this.title, required this.subtitle, this.subtitleExtra, required this.trailing});
  final Widget icon;
  final String title;
  final String subtitle;
  final String? subtitleExtra;
  final Widget trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: const Color(0xFFE8F4F8), borderRadius: BorderRadius.circular(14)),
        child: Row(children: [
          icon,
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w500, color: Color(0xFF1E3A4C))),
            Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF5A7C8D))),
            if (subtitleExtra != null)
              Text(subtitleExtra!, style: const TextStyle(fontSize: 11, color: Color(0xFF5A7C8D))),
          ])),
          const SizedBox(width: 8),
          trailing,
        ]),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final String icon;
  final String label;
  final String value;

  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);
  static const _border = Color(0x1F2C7A9B);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
      ),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: _mutedForeground),
                ),
                FittedBox(
                  alignment: Alignment.centerLeft,
                  fit: BoxFit.scaleDown,
                  child: Text(
                    value,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ToggleRow extends StatefulWidget {
  const _ToggleRow({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  State<_ToggleRow> createState() => _ToggleRowState();
}

class _ToggleRowState extends State<_ToggleRow> {
  bool value = true;

  static const _muted = Color(0xFFE8F4F8);
  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);
  static const _primary = Color(0xFF2C7A9B);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: _muted,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.title, style: const TextStyle(fontWeight: FontWeight.w500, color: _foreground)),
                const SizedBox(height: 2),
                Text(widget.subtitle, style: const TextStyle(fontSize: 12, color: _mutedForeground)),
              ],
            ),
          ),
          Switch(
            value: value,
            activeColor: Colors.white,
            activeTrackColor: _primary,
            onChanged: (v) => setState(() => value = v),
          ),
        ],
      ),
    );
  }
}

class PatientMessagesPage extends StatefulWidget {
  const PatientMessagesPage({
    super.key,
    required this.token,
    required this.userId,
  });

  final String token;
  final int userId;

  @override
  State<PatientMessagesPage> createState() => _PatientMessagesPageState();
}

class _PatientMessagesPageState extends State<PatientMessagesPage> {
  static const _primary = Color(0xFF2C7A9B);
  static const _secondary = Color(0xFFE0F2F7);
  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);
  static const _border = Color(0x1F2C7A9B);
  static const _muted = Color(0xFFF1F7F9);

  final _api = const ApiService();
  final _messageController = TextEditingController();

  bool _loading = true;
  bool _sending = false;
  String? _error;
  String? _debugInfo;
  List<_Message> _messages = [];
  int? _selectedOtherId;
  int? _messageUserId;

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final resolvedUserId = await _resolveMessageUserId();
      final candidateIds = <int>[
        resolvedUserId,
        widget.userId,
      ].where((id) => id > 0).toSet().toList();

      final fetch = await _api.getThreadsDebug(widget.token, candidateIds);
      final activeUserId = fetch.activeUserId == 0 ? resolvedUserId : fetch.activeUserId;
      final rows = fetch.rows;

      final messages = rows
          .whereType<Map>()
          .map((row) => _Message.fromJson(Map<String, dynamic>.from(row), activeUserId))
          .where((m) => m.otherId != 0 && m.body.trim().isNotEmpty)
          .toList()
        ..sort((a, b) => a.sentAt.compareTo(b.sentAt));

      final conversations = _buildConversations(messages);
      setState(() {
        _messageUserId = activeUserId;
        _debugInfo = fetch.attempts.join('\n');
        _messages = messages;
        if (_selectedOtherId == null && conversations.isNotEmpty) {
          _selectedOtherId = conversations.first.otherId;
        } else if (_selectedOtherId != null && !conversations.any((c) => c.otherId == _selectedOtherId)) {
          _selectedOtherId = conversations.isEmpty ? null : conversations.first.otherId;
        }
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<int> _resolveMessageUserId() async {
    try {
      final patient = await _api.getPatient(widget.token, widget.userId);
      final raw = patient['user_id'] ??
          patient['userId'] ??
          patient['account_id'] ??
          (patient['user'] is Map ? (patient['user'] as Map)['id'] : null);
      final parsed = int.tryParse('$raw');
      // Only override if the profile returns a *different* user_id field.
      // If it's the same value as widget.userId, skip it to avoid accidentally
      // using a patient-table PK that doesn't match users.id in messages.
      if (parsed != null && parsed > 0 && parsed != widget.userId) return parsed;
    } catch (_) {}
    return widget.userId;
  }

  List<_Conversation> _buildConversations(List<_Message> messages) {
    final byUser = <int, List<_Message>>{};
    for (final message in messages) {
      byUser.putIfAbsent(message.otherId, () => []).add(message);
    }

    final conversations = byUser.entries.map((entry) {
      final items = entry.value..sort((a, b) => a.sentAt.compareTo(b.sentAt));
      return _Conversation(
        otherId: entry.key,
        otherName: items.last.otherName,
        lastMessage: items.last,
        unreadCount: items.where((m) => !m.isMine && !m.isRead).length,
      );
    }).toList()
      ..sort((a, b) => b.lastMessage.sentAt.compareTo(a.lastMessage.sentAt));

    return conversations;
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    final receiverId = _selectedOtherId;
    if (text.isEmpty || receiverId == null || _sending) return;

    setState(() => _sending = true);
    try {
      await _api.sendMessage(widget.token, _messageUserId ?? widget.userId, receiverId, text);
      _messageController.clear();
      await _loadMessages();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final conversations = _buildConversations(_messages);
    final selectedMessages = _selectedOtherId == null
        ? <_Message>[]
        : _messages.where((m) => m.otherId == _selectedOtherId).toList();
    String? selectedName;
    for (final conversation in conversations) {
      if (conversation.otherId == _selectedOtherId) {
        selectedName = conversation.otherName;
        break;
      }
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
      children: [
        const Text(
          'Messages',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground),
        ),
        const SizedBox(height: 6),
        const Text(
          'Chat with your care team',
          style: TextStyle(fontSize: 14, color: _mutedForeground),
        ),
        const SizedBox(height: 20),
        if (_loading)
          const _MessageCard(child: Center(child: CircularProgressIndicator(color: _primary)))
        else if (_error != null)
          _MessageCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Could not load messages', style: TextStyle(fontWeight: FontWeight.w600, color: _foreground)),
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: _mutedForeground)),
                const SizedBox(height: 12),
                ElevatedButton(onPressed: _loadMessages, child: const Text('Try again')),
              ],
            ),
          )
        else if (conversations.isEmpty)
          _MessageCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('No messages yet.', style: TextStyle(color: _mutedForeground)),
                const SizedBox(height: 12),
                const Text('Debug info', style: TextStyle(fontWeight: FontWeight.w600, color: _foreground)),
                const SizedBox(height: 6),
                SelectableText(
                  'Logged-in user id: ${widget.userId}\nMessage user id tried: ${_messageUserId ?? widget.userId}\n${_debugInfo ?? ''}',
                  style: const TextStyle(fontSize: 11, color: _mutedForeground, height: 1.35),
                ),
                const SizedBox(height: 12),
                ElevatedButton(onPressed: _loadMessages, child: const Text('Refresh')),
              ],
            ),
          )
        else ...[
          _MessageCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Conversations', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: _foreground)),
                const SizedBox(height: 12),
                ...conversations.map((conversation) {
                  final selected = conversation.otherId == _selectedOtherId;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => setState(() => _selectedOtherId = conversation.otherId),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: selected ? _secondary : _muted,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: selected ? _primary.withOpacity(.25) : Colors.transparent),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: Colors.white,
                              child: Text(conversation.initials, style: const TextStyle(color: _primary, fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(conversation.otherName, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, color: _foreground)),
                                      ),
                                      Text(conversation.timeLabel, style: const TextStyle(fontSize: 11, color: _mutedForeground)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(conversation.lastMessage.body, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: _mutedForeground)),
                                ],
                              ),
                            ),
                            if (conversation.unreadCount > 0) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: _primary, borderRadius: BorderRadius.circular(999)),
                                child: Text('${conversation.unreadCount}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _MessageCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.chat_bubble_outline, color: _primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        selectedName ?? 'Conversation',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: _foreground),
                      ),
                    ),
                    IconButton(onPressed: _loadMessages, icon: const Icon(Icons.refresh, color: _primary)),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  constraints: const BoxConstraints(minHeight: 220, maxHeight: 360),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: _muted, borderRadius: BorderRadius.circular(14)),
                  child: selectedMessages.isEmpty
                      ? const Center(child: Text('Select a conversation to view messages.', style: TextStyle(color: _mutedForeground)))
                      : ListView.builder(
                          shrinkWrap: true,
                          itemCount: selectedMessages.length,
                          itemBuilder: (context, index) => _ChatBubble(message: selectedMessages[index]),
                        ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        minLines: 1,
                        maxLines: 4,
                        decoration: InputDecoration(
                          hintText: 'Type a message...',
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: _border)),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: _border)),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: _primary)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    IconButton.filled(
                      onPressed: _sending ? null : _sendMessage,
                      style: IconButton.styleFrom(backgroundColor: _primary, disabledBackgroundColor: _mutedForeground),
                      icon: _sending
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.send, color: Colors.white),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _Message {
  const _Message({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.body,
    required this.sentAt,
    required this.isRead,
    required this.isMine,
    required this.otherId,
    required this.otherName,
  });

  final int id;
  final int senderId;
  final int receiverId;
  final String body;
  final DateTime sentAt;
  final bool isRead;
  final bool isMine;
  final int otherId;
  final String otherName;

  factory _Message.fromJson(Map<String, dynamic> json, int currentUserId) {
    final senderId = int.tryParse('${json['sender_id'] ?? 0}') ?? 0;
    final receiverId = int.tryParse('${json['receiver_id'] ?? 0}') ?? 0;
    final isMine = senderId == currentUserId;
    final otherId = isMine ? receiverId : senderId;
    // PHP returns a single pre-concatenated name field (sender_name / receiver_name).
    // There is no separate surname column, so use the full field directly.
    final name = ((isMine ? json['receiver_name'] : json['sender_name']) ?? '')
        .toString()
        .trim();

    return _Message(
      id: int.tryParse('${json['id'] ?? 0}') ?? 0,
      senderId: senderId,
      receiverId: receiverId,
      body: '${json['body'] ?? json['message'] ?? json['content'] ?? ''}',
      sentAt: DateTime.tryParse('${json['sent_at'] ?? json['created_at'] ?? json['timestamp'] ?? ''}') ?? DateTime.fromMillisecondsSinceEpoch(0),
      isRead: json['is_read'] == true || json['is_read'] == 1 || json['is_read'] == '1',
      isMine: isMine,
      otherId: otherId,
      otherName: name.isEmpty ? 'User $otherId' : name,
    );
  }
}

class _Conversation {
  const _Conversation({
    required this.otherId,
    required this.otherName,
    required this.lastMessage,
    required this.unreadCount,
  });

  final int otherId;
  final String otherName;
  final _Message lastMessage;
  final int unreadCount;

  String get initials {
    final parts = otherName.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return '${parts.first.characters.first}${parts.last.characters.first}'.toUpperCase();
  }

  String get timeLabel => _formatMessageTime(lastMessage.sentAt);
}

class _MessageCard extends StatelessWidget {
  const _MessageCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _PatientMessagesPageState._border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message});

  final _Message message;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: message.isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * .68),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: message.isMine ? _PatientMessagesPageState._primary : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(message.isMine ? 16 : 4),
            bottomRight: Radius.circular(message.isMine ? 4 : 16),
          ),
          border: Border.all(color: message.isMine ? _PatientMessagesPageState._primary : _PatientMessagesPageState._border),
        ),
        child: Column(
          crossAxisAlignment: message.isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              message.body,
              style: TextStyle(color: message.isMine ? Colors.white : _PatientMessagesPageState._foreground, height: 1.3),
            ),
            const SizedBox(height: 4),
            Text(
              _formatMessageTime(message.sentAt),
              style: TextStyle(fontSize: 10, color: message.isMine ? Colors.white70 : _PatientMessagesPageState._mutedForeground),
            ),
          ],
        ),
      ),
    );
  }
}

String _formatMessageTime(DateTime date) {
  if (date.millisecondsSinceEpoch == 0) return '';
  final now = DateTime.now();
  final local = date.toLocal();
  final sameDay = now.year == local.year && now.month == local.month && now.day == local.day;
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  if (sameDay) return '$hour:$minute';
  return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')} $hour:$minute';
}

class PatientSettingsPage extends StatelessWidget {
  const PatientSettingsPage({super.key});

  static const _mutedForeground = Color(0xFF5A7C8D);

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Settings page next.\nWe can port the patient settings/profile screen after this.',
          textAlign: TextAlign.center,
          style: TextStyle(color: _mutedForeground, fontSize: 16),
        ),
      ),
    );
  }
}
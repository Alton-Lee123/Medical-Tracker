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
  return '$h12:$m $ampm';
}

String _formatMessageTime(DateTime date) {
  if (date.millisecondsSinceEpoch == 0) return '';
  final now = DateTime.now();
  final sameDay = date.year == now.year && date.month == now.month && date.day == now.day;
  if (sameDay) return _formatTime('${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}');
  return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}';
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
    PatientDashboardPage(name: widget.name, token: widget.token, userId: widget.userId),
    PatientMedicationsPage(token: widget.token, userId: widget.userId),
    PatientHistoryPage(token: widget.token, userId: widget.userId),
    PatientRemindersPage(token: widget.token, userId: widget.userId),
    PatientMessagesPage(token: widget.token, userId: widget.userId),
    PatientSettingsPage(
      name: widget.name,
      token: widget.token,
      userId: widget.userId,
      onLogout: widget.onLogout,
    ),
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
            Text('MedTrack', style: TextStyle(color: _primary, fontWeight: FontWeight.bold, fontSize: 20)),
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
        bottom: PreferredSize(preferredSize: const Size.fromHeight(1), child: Container(height: 1, color: _border)),
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
  const PatientRemindersPage({super.key, required this.token, required this.userId});

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
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final patient = await _api.getPatient(widget.token, widget.userId);
      final meds = List<dynamic>.from(patient['medications'] ?? []);
      final patientId = int.tryParse('${patient['id'] ?? widget.userId}') ?? widget.userId;

      final today = DateTime.now().toIso8601String().substring(0, 10);
      final takenToday = <int>{};
      for (final med in meds) {
        final medId = int.tryParse('${med['id']}') ?? 0;
        if (medId == 0) continue;
        final logs = await _api.getMedicationLogs(widget.token, medId);
        if (logs.any((l) => '${l['taken_date']}' == today)) takenToday.add(medId);
      }

      final rxs = await _api.getPrescriptions(widget.token, patientId);
      final apts = await _api.getAppointments(widget.token, patientId);
      final now = DateTime.now();
      final upcomingApts = apts.where((a) {
        try {
          final d = a['date']?.toString() ?? '';
          final t = a['time']?.toString() ?? '00:00:00';
          return DateTime.parse('${d}T$t').isAfter(now);
        } catch (_) {
          return false;
        }
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
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
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
            _SectionCard(
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
            _ReminderSection(
              title: "Today's Schedule",
              empty: _meds.isEmpty ? 'No medications scheduled.' : null,
              children: _meds.map<Widget>((med) {
                final medId = int.tryParse('${med['id']}') ?? 0;
                final taken = _takenTodayIds.contains(medId);
                final name = (med['name'] ?? '?').toString();
                return _ReminderRow(
                  icon: CircleAvatar(
                    backgroundColor: taken ? _accent : _secondary,
                    child: Text(name.isEmpty ? '?' : name[0].toUpperCase(), style: TextStyle(color: taken ? Colors.white : _primary, fontWeight: FontWeight.w700)),
                  ),
                  title: name,
                  subtitle: '${med['dose'] ?? ''} · ${med['frequency'] ?? ''}',
                  trailing: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text(_formatTime((med['time'] ?? '').toString()), style: const TextStyle(fontWeight: FontWeight.w600, color: _primary)),
                    if (taken) const Text('✓ Taken', style: TextStyle(fontSize: 11, color: _accent, fontWeight: FontWeight.w600)),
                  ]),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            _ReminderSection(
              title: '💊 My Prescriptions',
              empty: _prescriptions.isEmpty ? 'No prescriptions on file.' : null,
              children: _prescriptions.map<Widget>((rx) {
                final status = rx['status']?.toString();
                final med = (rx['medication'] ?? rx['medication_name'] ?? '?').toString();
                return _ReminderRow(
                  icon: CircleAvatar(
                    backgroundColor: _primary,
                    child: Text(med.isEmpty ? '?' : med[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                  ),
                  title: '$med ${rx['dose'] ?? ''}'.trim(),
                  subtitle: [
                    rx['frequency']?.toString(),
                    rx['doctor_name'] != null ? 'Dr. ${rx['doctor_name']} ${rx['doctor_surname'] ?? ''}' : null,
                  ].where((s) => s != null && s.trim().isNotEmpty).join(' · '),
                  subtitleExtra: rx['refill_date'] != null ? 'Refill: ${rx['refill_date']}' : null,
                  trailing: Text(_rxStatusLabel(status), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _rxStatusColor(status))),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            _ReminderSection(
              title: 'Appointments',
              empty: _appointments.isEmpty ? 'No upcoming appointments.' : null,
              children: _appointments.map<Widget>((apt) => _ReminderRow(
                    icon: const CircleAvatar(backgroundColor: _secondary, child: Text('📅', style: TextStyle(fontSize: 18))),
                    title: (apt['title'] ?? apt['reason'] ?? 'Appointment').toString(),
                    subtitle: [
                      apt['date']?.toString(),
                      apt['time'] != null ? 'at ${_formatTime(apt['time'].toString())}' : null,
                      apt['doctor_name'] != null ? 'Dr. ${apt['doctor_name']}' : null,
                    ].where((s) => s != null && s.trim().isNotEmpty).join(' · '),
                    trailing: const Text('Upcoming', style: TextStyle(fontSize: 11, color: _primary, fontWeight: FontWeight.w600)),
                  )).toList(),
            ),
            const SizedBox(height: 16),
            const _SectionCard(
              title: 'Notification Settings',
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
    return _SectionCard(
      title: title,
      child: empty != null
          ? Text(empty!, style: const TextStyle(color: Color(0xFF5A7C8D)))
          : Column(children: children),
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
          SizedBox(width: 40, height: 40, child: icon),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w500, color: Color(0xFF1E3A4C))),
            Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF5A7C8D))),
            if (subtitleExtra != null) Text(subtitleExtra!, style: const TextStyle(fontSize: 11, color: Color(0xFF5A7C8D))),
          ])),
          const SizedBox(width: 8),
          trailing,
        ]),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.icon, required this.label, required this.value});

  final String icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0x1F2C7A9B))),
      child: Row(children: [
        Text(icon, style: const TextStyle(fontSize: 24)),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Color(0xFF5A7C8D))),
            FittedBox(alignment: Alignment.centerLeft, fit: BoxFit.scaleDown, child: Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Color(0xFF1E3A4C)))),
          ]),
        ),
      ]),
    );
  }
}

class _ToggleRow extends StatefulWidget {
  const _ToggleRow({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  State<_ToggleRow> createState() => _ToggleRowState();
}

class _ToggleRowState extends State<_ToggleRow> {
  bool value = true;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(color: const Color(0xFFE8F4F8), borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(widget.title, style: const TextStyle(fontWeight: FontWeight.w500, color: Color(0xFF1E3A4C))),
          const SizedBox(height: 2),
          Text(widget.subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF5A7C8D))),
        ])),
        Switch(value: value, activeColor: Colors.white, activeTrackColor: const Color(0xFF2C7A9B), onChanged: (v) => setState(() => value = v)),
      ]),
    );
  }
}

class PatientMessagesPage extends StatefulWidget {
  const PatientMessagesPage({super.key, required this.token, required this.userId});

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
      final activeUserId = await _resolveMessageUserId();
      final rows = await _api.getThreads(widget.token, widget.userId);
      final messages = rows
          .whereType<Map>()
          .map((row) => _Message.fromJson(Map<String, dynamic>.from(row), activeUserId))
          .where((m) => m.otherId != 0 && m.body.trim().isNotEmpty)
          .toList()
        ..sort((a, b) => a.sentAt.compareTo(b.sentAt));

      final conversations = _buildConversations(messages);
      if (!mounted) return;
      setState(() {
        _messageUserId = activeUserId;
        _messages = messages;
        if (_selectedOtherId == null && conversations.isNotEmpty) {
          _selectedOtherId = conversations.first.otherId;
        } else if (_selectedOtherId != null && !conversations.any((c) => c.otherId == _selectedOtherId)) {
          _selectedOtherId = conversations.isEmpty ? null : conversations.first.otherId;
        }
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<int> _resolveMessageUserId() async {
    try {
      final patient = await _api.getPatient(widget.token, widget.userId);
      final raw = patient['user_id'] ?? patient['userId'] ?? patient['account_id'] ?? (patient['user'] is Map ? (patient['user'] as Map)['id'] : null);
      final parsed = int.tryParse('$raw');
      if (parsed != null && parsed > 0) return parsed;
    } catch (_) {}
    return widget.userId;
  }

  List<_Conversation> _buildConversations(List<_Message> messages) {
    final byUser = <int, List<_Message>>{};
    for (final message in messages) {
      byUser.putIfAbsent(message.otherId, () => []).add(message);
    }
    return byUser.entries.map((entry) {
      final items = entry.value..sort((a, b) => a.sentAt.compareTo(b.sentAt));
      return _Conversation(
        otherId: entry.key,
        otherName: items.last.otherName,
        lastMessage: items.last,
        unreadCount: items.where((m) => !m.isMine && !m.isRead).length,
      );
    }).toList()
      ..sort((a, b) => b.lastMessage.sentAt.compareTo(a.lastMessage.sentAt));
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final conversations = _buildConversations(_messages);
    final selectedMessages = _selectedOtherId == null ? <_Message>[] : _messages.where((m) => m.otherId == _selectedOtherId).toList();
    String? selectedName;
    for (final conversation in conversations) {
      if (conversation.otherId == _selectedOtherId) selectedName = conversation.otherName;
    }

    return RefreshIndicator(
      onRefresh: _loadMessages,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          const Text('Messages', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground)),
          const SizedBox(height: 6),
          const Text('Chat with your care team', style: TextStyle(fontSize: 14, color: _mutedForeground)),
          const SizedBox(height: 20),
          if (_loading)
            const _MessageCard(child: Center(child: CircularProgressIndicator(color: _primary)))
          else if (_error != null)
            _MessageCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Could not load messages', style: TextStyle(fontWeight: FontWeight.w600, color: _foreground)),
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: _mutedForeground)),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _loadMessages, child: const Text('Try again')),
            ]))
          else if (conversations.isEmpty)
            _MessageCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('No messages yet.', style: TextStyle(color: _mutedForeground)),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _loadMessages, child: const Text('Refresh')),
            ]))
          else ...[
            _MessageCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
                      child: Row(children: [
                        CircleAvatar(backgroundColor: Colors.white, child: Text(conversation.initials, style: const TextStyle(color: _primary, fontWeight: FontWeight.bold))),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Expanded(child: Text(conversation.otherName, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, color: _foreground))),
                            Text(conversation.timeLabel, style: const TextStyle(fontSize: 11, color: _mutedForeground)),
                          ]),
                          const SizedBox(height: 4),
                          Text(conversation.lastMessage.body, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: _mutedForeground)),
                        ])),
                        if (conversation.unreadCount > 0) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: _primary, borderRadius: BorderRadius.circular(999)),
                            child: Text('${conversation.unreadCount}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ]),
                    ),
                  ),
                );
              }),
            ])),
            const SizedBox(height: 16),
            _MessageCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.chat_bubble_outline, color: _primary),
                const SizedBox(width: 8),
                Expanded(child: Text(selectedName ?? 'Conversation', overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: _foreground))),
                IconButton(onPressed: _loadMessages, icon: const Icon(Icons.refresh, color: _primary)),
              ]),
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
              Row(children: [
                Expanded(child: TextField(
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
                )),
                const SizedBox(width: 10),
                IconButton.filled(
                  onPressed: _sending ? null : _sendMessage,
                  style: IconButton.styleFrom(backgroundColor: _primary, disabledBackgroundColor: _mutedForeground),
                  icon: _sending ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.send, color: Colors.white),
                ),
              ]),
            ])),
          ],
        ],
      ),
    );
  }
}

class _Message {
  const _Message({required this.id, required this.senderId, required this.receiverId, required this.body, required this.sentAt, required this.isRead, required this.isMine, required this.otherId, required this.otherName});

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
    final name = ((isMine ? json['receiver_name'] : json['sender_name']) ?? '').toString().trim();
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
  const _Conversation({required this.otherId, required this.otherName, required this.lastMessage, required this.unreadCount});

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
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(.03), blurRadius: 12, offset: const Offset(0, 4))],
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
        child: Column(crossAxisAlignment: message.isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
          Text(message.body, style: TextStyle(color: message.isMine ? Colors.white : _PatientMessagesPageState._foreground, height: 1.3)),
          const SizedBox(height: 4),
          Text(_formatMessageTime(message.sentAt), style: TextStyle(fontSize: 10, color: message.isMine ? Colors.white70 : _PatientMessagesPageState._mutedForeground)),
        ]),
      ),
    );
  }
}

class PatientSettingsPage extends StatefulWidget {
  const PatientSettingsPage({super.key, required this.name, required this.token, required this.userId, required this.onLogout});

  final String name;
  final String token;
  final int userId;
  final Future<void> Function() onLogout;

  @override
  State<PatientSettingsPage> createState() => _PatientSettingsPageState();
}

class _PatientSettingsPageState extends State<PatientSettingsPage> {
  static const _primary = Color(0xFF2C7A9B);
  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);

  final _api = const ApiService();
  Map<String, dynamic>? _profile;
  bool _loading = true;
  String? _error;
  bool _medReminders = true;
  bool _missedDoseAlerts = true;
  bool _appointmentReminders = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final profile = await _api.getPatient(widget.token, widget.userId);
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  String _field(String key, {String fallback = 'Not set'}) {
    final value = _profile?[key];
    if (value == null) return fallback;
    final text = value.toString().trim();
    return text.isEmpty ? fallback : text;
  }

  String get _fullName {
    final first = _field('name', fallback: '').trim();
    final last = _field('surname', fallback: '').trim();
    final joined = '$first $last'.trim();
    return joined.isEmpty ? widget.name : joined;
  }

  String get _initials {
    final parts = _fullName.split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return 'U';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return '${parts.first.characters.first}${parts.last.characters.first}'.toUpperCase();
  }

  Future<void> _openEditProfile() async {
    final gender = TextEditingController(text: _field('gender', fallback: ''));
    final dob = TextEditingController(text: _field('date_of_birth', fallback: ''));
    final allergies = TextEditingController(text: _field('allergies', fallback: ''));
    final injuries = TextEditingController(text: _field('previous_injuries', fallback: ''));
    final lastVisit = TextEditingController(text: _field('last_hospital_visit', fallback: ''));

    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit medical profile'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            _EditField(controller: gender, label: 'Gender'),
            _EditField(controller: dob, label: 'Date of birth', hint: 'YYYY-MM-DD'),
            _EditField(controller: allergies, label: 'Allergies'),
            _EditField(controller: injuries, label: 'Previous injuries'),
            _EditField(controller: lastVisit, label: 'Last hospital visit', hint: 'YYYY-MM-DD'),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
        ],
      ),
    );

    if (saved != true) return;
    try {
      await _api.updateProfile(widget.token, widget.userId, {
        'gender': gender.text.trim(),
        'date_of_birth': dob.text.trim(),
        'allergies': allergies.text.trim(),
        'previous_injuries': injuries.text.trim(),
        'last_hospital_visit': lastVisit.text.trim(),
      });
      await _loadProfile();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadProfile,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          const Text('Settings', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground)),
          const SizedBox(height: 6),
          const Text('Manage your account and medical profile', style: TextStyle(fontSize: 14, color: _mutedForeground)),
          const SizedBox(height: 20),
          if (_loading)
            const Padding(padding: EdgeInsets.only(top: 40), child: Center(child: CircularProgressIndicator()))
          else if (_error != null)
            _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Could not load profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: _foreground)),
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: _mutedForeground)),
              const SizedBox(height: 14),
              OutlinedButton(onPressed: _loadProfile, child: const Text('Retry')),
            ]))
          else ...[
            _SectionCard(child: Row(children: [
              CircleAvatar(radius: 32, backgroundColor: const Color(0xFFE0F2F7), child: Text(_initials, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: _primary))),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_fullName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: _foreground)),
                const SizedBox(height: 4),
                Text(_field('email'), style: const TextStyle(color: _mutedForeground)),
                const SizedBox(height: 4),
                Text('Patient ID: ${_field('id')}', style: const TextStyle(fontSize: 12, color: _mutedForeground)),
              ])),
            ])),
            _SectionCard(
              title: 'Medical Information',
              trailing: TextButton.icon(onPressed: _openEditProfile, icon: const Icon(Icons.edit_outlined, size: 18), label: const Text('Edit')),
              child: Column(children: [
                _InfoRow(label: 'Date of Birth', value: _field('date_of_birth')),
                _InfoRow(label: 'Gender', value: _field('gender')),
                _InfoRow(label: 'Condition', value: _field('condition')),
                _InfoRow(label: 'Allergies', value: _field('allergies')),
                _InfoRow(label: 'Previous Injuries', value: _field('previous_injuries')),
                _InfoRow(label: 'Last Hospital Visit', value: _field('last_hospital_visit')),
              ]),
            ),
            _SectionCard(
              title: 'Notification Settings',
              child: Column(children: [
                _SettingsSwitch(title: 'Medication Reminders', subtitle: 'Get notified before each dose', value: _medReminders, onChanged: (v) => setState(() => _medReminders = v)),
                const SizedBox(height: 12),
                _SettingsSwitch(title: 'Missed Dose Alerts', subtitle: 'Alert when a dose is missed', value: _missedDoseAlerts, onChanged: (v) => setState(() => _missedDoseAlerts = v)),
                const SizedBox(height: 12),
                _SettingsSwitch(title: 'Appointment Reminders', subtitle: 'Get notified about upcoming appointments', value: _appointmentReminders, onChanged: (v) => setState(() => _appointmentReminders = v)),
              ]),
            ),
            _SectionCard(
              title: 'Account',
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                _InfoRow(label: 'Logged in as', value: _fullName),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: widget.onLogout,
                  icon: const Icon(Icons.logout),
                  label: const Text('Log out'),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Color(0xFFFFCDD2)), padding: const EdgeInsets.symmetric(vertical: 14)),
                ),
              ]),
            ),
          ],
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({this.title, this.trailing, required this.child});

  final String? title;
  final Widget? trailing;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0x1F2C7A9B))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (title != null) ...[
          Row(children: [
            Expanded(child: Text(title!, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF1E3A4C)))),
            if (trailing != null) trailing!,
          ]),
          const SizedBox(height: 14),
        ],
        child,
      ]),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFFE8F4F8), borderRadius: BorderRadius.circular(14)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF5A7C8D))),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1E3A4C))),
      ]),
    );
  }
}

class _SettingsSwitch extends StatelessWidget {
  const _SettingsSwitch({required this.title, required this.subtitle, required this.value, required this.onChanged});

  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFFE8F4F8), borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1E3A4C))),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF5A7C8D))),
        ])),
        Switch(value: value, activeColor: const Color(0xFF2C7A9B), onChanged: onChanged),
      ]),
    );
  }
}

class _EditField extends StatelessWidget {
  const _EditField({required this.controller, required this.label, this.hint});

  final TextEditingController controller;
  final String label;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(controller: controller, decoration: InputDecoration(labelText: label, hintText: hint, border: const OutlineInputBorder())),
    );
  }
}
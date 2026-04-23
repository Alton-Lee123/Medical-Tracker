import 'package:flutter/material.dart';
import 'package:mobile/patient_page.dart';

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
    const PatientHistoryPage(),
    const PatientRemindersPage(),
    const PatientMessagesPage(),
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

class PatientHistoryPage extends StatelessWidget {
  const PatientHistoryPage({super.key});

  static const _secondary = Color(0xFFE0F2F7);
  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);
  static const _border = Color(0x1F2C7A9B);
  static const _accent = Color(0xFF4DB6AC);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
      children: [
        const Text(
          'Medication History',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground),
        ),
        const SizedBox(height: 6),
        const Text(
          'Track your medication adherence over time',
          style: TextStyle(fontSize: 14, color: _mutedForeground),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: _border),
          ),
          child: Column(
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Weekly Summary',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: _foreground),
                  ),
                  Row(
                    children: [
                      _NavChip('←'),
                      SizedBox(width: 8),
                      _NavChip('Current Week'),
                      SizedBox(width: 8),
                      _NavChip('→'),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: _secondary,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Apr 21 - Apr 27, 2026', style: TextStyle(fontSize: 14, color: _mutedForeground)),
                        SizedBox(height: 4),
                        Text('82% Adherence', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground)),
                      ],
                    ),
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: Colors.white,
                      child: Text('82%', style: TextStyle(color: Color(0xFF2C7A9B), fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: _border),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('History table placeholder', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: _foreground)),
              SizedBox(height: 10),
              Text('Next step: port the calendar grid from the HTML history page.', style: TextStyle(color: _mutedForeground)),
              SizedBox(height: 12),
              LinearProgressIndicator(value: 0.82, color: _accent, backgroundColor: _secondary),
            ],
          ),
        ),
      ],
    );
  }
}

class _NavChip extends StatelessWidget {
  const _NavChip(this.label);

  final String label;

  static const _secondary = Color(0xFFE0F2F7);
  static const _foreground = Color(0xFF1E3A4C);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: _secondary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label, style: const TextStyle(color: _foreground)),
    );
  }
}

class PatientRemindersPage extends StatelessWidget {
  const PatientRemindersPage({super.key});

  static const _primary = Color(0xFF2C7A9B);
  static const _secondary = Color(0xFFE0F2F7);
  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);
  static const _border = Color(0x1F2C7A9B);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
      children: [
        const Text(
          'Reminders',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground),
        ),
        const SizedBox(height: 6),
        const Text(
          'Stay on track with your medication schedule',
          style: TextStyle(fontSize: 14, color: _mutedForeground),
        ),
        const SizedBox(height: 20),
        const Row(
          children: [
            Expanded(child: _StatCard(icon: '💊', label: "Today's Doses", value: '3')),
            SizedBox(width: 15),
            Expanded(child: _StatCard(icon: '✓', label: 'Taken', value: '1')),
          ],
        ),
        const SizedBox(height: 20),
        const _CardSection(
          title: "Today's Schedule",
          child: Column(
            children: [
              _ReminderRow(name: 'Lisinopril', dose: '10mg', time: '08:00'),
              SizedBox(height: 10),
              _ReminderRow(name: 'Metformin', dose: '500mg', time: '13:00'),
            ],
          ),
        ),
        const _CardSection(
          title: '💊 My Prescriptions',
          child: Column(
            children: [
              _SimpleLine(text: 'Lisinopril 10mg — active'),
              SizedBox(height: 10),
              _SimpleLine(text: 'Metformin 500mg — refill due'),
            ],
          ),
        ),
        const _CardSection(
          title: 'Appointments',
          child: Column(
            children: [
              _SimpleLine(text: 'Dr. Smith — Apr 25, 10:30'),
              SizedBox(height: 10),
              _SimpleLine(text: 'Blood test — Apr 29, 08:00'),
            ],
          ),
        ),
        const _CardSection(
          title: 'Notification Settings',
          child: Column(
            children: [
              _ToggleRow(
                title: 'Medication Reminders',
                subtitle: 'Get notified before each dose',
              ),
              SizedBox(height: 12),
              _ToggleRow(
                title: 'Missed Dose Alerts',
                subtitle: 'Alert when a dose is missed',
              ),
            ],
          ),
        ),
      ],
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
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: _mutedForeground)),
              Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground)),
            ],
          ),
        ],
      ),
    );
  }
}

class _CardSection extends StatelessWidget {
  const _CardSection({
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  static const _foreground = Color(0xFF1E3A4C);
  static const _border = Color(0x1F2C7A9B);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: _foreground),
          ),
          const SizedBox(height: 15),
          child,
        ],
      ),
    );
  }
}

class _ReminderRow extends StatelessWidget {
  const _ReminderRow({
    required this.name,
    required this.dose,
    required this.time,
  });

  final String name;
  final String dose;
  final String time;

  static const _secondary = Color(0xFFE0F2F7);
  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);
  static const _muted = Color(0xFFE8F4F8);
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
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: _secondary,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: const Text('💊'),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w500, color: _foreground)),
                Text(dose, style: const TextStyle(fontSize: 12, color: _mutedForeground)),
              ],
            ),
          ),
          Text(time, style: const TextStyle(fontWeight: FontWeight.w600, color: _primary)),
        ],
      ),
    );
  }
}

class _SimpleLine extends StatelessWidget {
  const _SimpleLine({required this.text});

  final String text;

  static const _foreground = Color(0xFF1E3A4C);

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(text, style: const TextStyle(color: _foreground)),
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

class PatientMessagesPage extends StatelessWidget {
  const PatientMessagesPage({super.key});

  static const _mutedForeground = Color(0xFF5A7C8D);

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Messages page next.\nWe can port the chat UI after the patient shell is in place.',
          textAlign: TextAlign.center,
          style: TextStyle(color: _mutedForeground, fontSize: 16),
        ),
      ),
    );
  }
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


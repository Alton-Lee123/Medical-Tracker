import 'package:flutter/material.dart';
import 'package:mobile/api_service.dart';

class PatientDashboardPage extends StatefulWidget {
  const PatientDashboardPage({
    super.key,
    required this.name,
    required this.token,
    required this.userId,
  });

  final String name;
  final String token;
  final int userId;

  @override
  State<PatientDashboardPage> createState() => _PatientDashboardPageState();
}

class _PatientDashboardPageState extends State<PatientDashboardPage> {
  static const _primary = Color(0xFF2C7A9B);
  static const _secondary = Color(0xFFE0F2F7);
  static const _accent = Color(0xFF4DB6AC);
  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);
  static const _border = Color(0x1F2C7A9B);

  final _api = const ApiService();

  bool _loading = true;
  String? _error;
  List<dynamic> _meds = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final meds = await _api.getMedications(widget.token);
      if (!mounted) return;
      setState(() {
        _meds = meds;
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

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateText =
        '${_weekday(now.weekday)}, ${_month(now.month)} ${now.day}, ${now.year}';

    final takenCount = _meds.where((m) => m['taken'] == true).length;
    final adherence = _meds.isEmpty ? 0 : ((takenCount / _meds.length) * 100).round();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          Text(
            'Good morning, ${_firstName(widget.name)}!',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w600,
              color: _foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            dateText,
            style: const TextStyle(fontSize: 14, color: _mutedForeground),
          ),
          const SizedBox(height: 20),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: _border),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Today's Adherence",
                  style: TextStyle(fontSize: 14, color: _mutedForeground),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '$adherence%',
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.w700,
                        color: _foreground,
                      ),
                    ),
                    Container(
                      width: 60,
                      height: 60,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: _secondary,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '$adherence%',
                        style: const TextStyle(
                          color: _primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: Container(
                    height: 8,
                    color: const Color(0xFFE8F4F8),
                    child: Row(
                      children: [
                        Expanded(
                          flex: adherence == 0 ? 1 : adherence,
                          child: Container(
                            color: adherence == 0 ? Colors.transparent : _accent,
                          ),
                        ),
                        Expanded(
                          flex: adherence == 100 ? 1 : (100 - adherence),
                          child: const SizedBox(),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            "Today's Medications",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: _foreground,
            ),
          ),
          const SizedBox(height: 14),
          if (_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                _error!,
                style: const TextStyle(color: Colors.red),
              ),
            )
          else if (_meds.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text(
                'No medications found.',
                style: TextStyle(color: _mutedForeground),
              ),
            )
          else
            ..._meds.map(
              (med) => _MedicationCard(
                name: (med['name'] ?? '').toString(),
                dose: (med['dose'] ?? '').toString(),
                time: (med['time'] ?? '').toString(),
                frequency: (med['frequency'] ?? '').toString(),
                taken: med['taken'] == true,
              ),
            ),
        ],
      ),
    );
  }

  static String _firstName(String fullName) {
    if (fullName.trim().isEmpty) return 'there';
    return fullName.trim().split(' ').first;
  }

  static String _weekday(int weekday) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[weekday - 1];
  }

  static String _month(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }
}

class _MedicationCard extends StatelessWidget {
  const _MedicationCard({
    required this.name,
    required this.dose,
    required this.time,
    required this.frequency,
    required this.taken,
  });

  final String name;
  final String dose;
  final String time;
  final String frequency;
  final bool taken;

  static const _primary = Color(0xFF2C7A9B);
  static const _secondary = Color(0xFFE0F2F7);
  static const _muted = Color(0xFFE8F4F8);
  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);
  static const _border = Color(0x1F2C7A9B);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 45,
            height: 45,
            decoration: const BoxDecoration(
              color: _secondary,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : '💊',
              style: const TextStyle(
                color: _primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: _foreground,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  dose,
                  style: const TextStyle(
                    fontSize: 14,
                    color: _mutedForeground,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: taken ? _muted : _primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    taken ? 'Taken' : 'Mark as Taken',
                    style: TextStyle(
                      color: taken ? _mutedForeground : Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                time,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: _foreground,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                frequency,
                style: const TextStyle(
                  fontSize: 12,
                  color: _mutedForeground,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class PatientMedicationsPage extends StatefulWidget {
  const PatientMedicationsPage({
    super.key,
    required this.token,
        required this.userId,
  });

  final String token;
    final int userId;
  @override
  State<PatientMedicationsPage> createState() => _PatientMedicationsPageState();
}

class _PatientMedicationsPageState extends State<PatientMedicationsPage> {
  static const _primary = Color(0xFF2C7A9B);
  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);
  static const _border = Color(0x1F2C7A9B);

  final _api = const ApiService();

  bool _loading = true;
  String? _error;
  List<dynamic> _meds = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
      try {
            final meds = await _api.getMedications(
        token: widget.token,
        userId: widget.userId,
      );
      if (!mounted) return;
      setState(() {
        _meds = meds;
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

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'My Medications',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                  color: _foreground,
                ),
              ),
              FilledButton(
                onPressed: () {},
                style: FilledButton.styleFrom(backgroundColor: _primary),
                child: const Text('+ Add'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                _error!,
                style: const TextStyle(color: Colors.red),
              ),
            )
          else if (_meds.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text(
                'No medications found.',
                style: TextStyle(color: _mutedForeground),
              ),
            )
          else
            ..._meds.map(
              (med) => Container(
                margin: const EdgeInsets.only(bottom: 15),
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
                      (med['name'] ?? '').toString(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: _foreground,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _DetailItem(
                            label: 'Dose',
                            value: (med['dose'] ?? '').toString(),
                          ),
                        ),
                        Expanded(
                          child: _DetailItem(
                            label: 'Frequency',
                            value: (med['frequency'] ?? '').toString(),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    _DetailItem(
                      label: 'Time',
                      value: (med['time'] ?? '').toString(),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _DetailItem extends StatelessWidget {
  const _DetailItem({required this.label, required this.value});

  final String label;
  final String value;

  static const _foreground = Color(0xFF1E3A4C);
  static const _mutedForeground = Color(0xFF5A7C8D);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: _mutedForeground)),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: _foreground),
        ),
      ],
    );
  }
}
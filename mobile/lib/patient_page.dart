import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile/api_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const _primary          = Color(0xFF2C7A9B);
const _secondary        = Color(0xFFE0F2F7);
const _accent           = Color(0xFF4DB6AC);
const _foreground       = Color(0xFF1E3A4C);
const _mutedForeground  = Color(0xFF5A7C8D);
const _muted            = Color(0xFFE8F4F8);
const _border           = Color(0x1F2C7A9B);
const _destructive      = Color(0xFFEF5350);
const _warning          = Color(0xFFF59E0B);

String _formatTime(String raw) {
  if (raw.isEmpty) return '';
  final parts = raw.split(':');
  if (parts.length < 2) return raw;
  final h = int.tryParse(parts[0]) ?? 0;
  final m = parts[1];
  final ampm = h >= 12 ? 'PM' : 'AM';
  final h12  = h % 12 == 0 ? 12 : h % 12;
  return '$h12:$m $ampm';
}

String _today() => DateTime.now().toIso8601String().substring(0, 10);

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

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
  final _api = const ApiService();

  bool _loading = true;
  String? _error;
  List<dynamic> _meds    = [];
  List<dynamic> _logs    = [];
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

      // Fetch today's logs for each med
      final today = _today();
      final Set<int> takenToday = {};
      for (final med in meds) {
        final medId = med['id'] as int;
        final logs = await _api.getMedicationLogs(widget.token, medId);
        if (logs.any((l) => l['taken_date'] == today)) {
          takenToday.add(medId);
        }
      }

      if (!mounted) return;
      setState(() {
        _meds      = meds;
        _logs      = takenToday.toList();
        _loading   = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error   = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _markTaken(int medId) async {
    try {
      await _api.logTaken(widget.token, medId);
      setState(() { if (!_logs.contains(medId)) _logs.add(medId); });
    } catch (_) {}
  }

  bool _isTaken(int medId) => _logs.contains(medId);

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  String _firstName() {
    final n = widget.name.trim();
    return n.isEmpty ? 'there' : n.split(' ').first;
  }

  static String _weekday(int w) => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][w - 1];
  static String _month(int m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];

  @override
  Widget build(BuildContext context) {
    final now     = DateTime.now();
    final taken   = _meds.where((m) => _isTaken(m['id'] as int)).length;
    final total   = _meds.length;
    final adh     = total == 0 ? 0 : ((taken / total) * 100).round();
    final adhColor = adh >= 80 ? _accent : adh >= 60 ? _warning : _destructive;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          Text(
            '${_greeting()}, ${_firstName()}!',
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w600, color: _foreground),
          ),
          const SizedBox(height: 4),
          Text(
            '${_weekday(now.weekday)}, ${_month(now.month)} ${now.day}, ${now.year}',
            style: const TextStyle(fontSize: 14, color: _mutedForeground),
          ),
          const SizedBox(height: 20),

          // Adherence card
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: _border)),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Today's Adherence", style: TextStyle(fontSize: 14, color: _mutedForeground)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('$adh%', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w700, color: adhColor)),
                    Container(
                      width: 60, height: 60,
                      decoration: const BoxDecoration(shape: BoxShape.circle, color: _secondary),
                      alignment: Alignment.center,
                      child: Text('$adh%', style: TextStyle(color: adhColor, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: adh / 100,
                    minHeight: 8,
                    backgroundColor: _muted,
                    valueColor: AlwaysStoppedAnimation(adhColor),
                  ),
                ),
                const SizedBox(height: 8),
                Text('$taken of $total doses taken today', style: const TextStyle(fontSize: 12, color: _mutedForeground)),
              ],
            ),
          ),

          const SizedBox(height: 24),
          const Text("Today's Medications", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: _foreground)),
          const SizedBox(height: 14),

          if (_loading)
            const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
          else if (_error != null)
            Text(_error!, style: const TextStyle(color: Colors.red))
          else if (_meds.isEmpty)
            const Text('No medications added yet.', style: TextStyle(color: _mutedForeground))
          else
            ..._meds.map((med) {
              final medId = med['id'] as int;
              final taken = _isTaken(medId);
              return _MedicationCard(
                name: (med['name'] ?? '').toString(),
                dose: (med['dose'] ?? '').toString(),
                time: _formatTime((med['time'] ?? '').toString()),
                frequency: (med['frequency'] ?? '').toString(),
                taken: taken,
                onTake: taken ? null : () => _markTaken(medId),
              );
            }),
        ],
      ),
    );
  }
}

class _MedicationCard extends StatelessWidget {
  const _MedicationCard({
    required this.name,
    required this.dose,
    required this.time,
    required this.frequency,
    required this.taken,
    required this.onTake,
  });

  final String name;
  final String dose;
  final String time;
  final String frequency;
  final bool taken;
  final VoidCallback? onTake;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: _border)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 45, height: 45,
            decoration: const BoxDecoration(color: _secondary, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(name.isNotEmpty ? name[0].toUpperCase() : '💊', style: const TextStyle(color: _primary, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: _foreground)),
                const SizedBox(height: 2),
                Text('$dose · $frequency', style: const TextStyle(fontSize: 13, color: _mutedForeground)),
                const SizedBox(height: 10),
                GestureDetector(
                  onTap: onTake,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                    decoration: BoxDecoration(
                      color: taken ? _muted : _primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      taken ? '✓ Taken' : 'Mark as Taken',
                      style: TextStyle(color: taken ? _mutedForeground : Colors.white, fontWeight: FontWeight.w500),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(time, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _foreground)),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  MEDICATIONS PAGE
// ─────────────────────────────────────────────────────────────────────────────

class PatientMedicationsPage extends StatefulWidget {
  const PatientMedicationsPage({super.key, required this.token, required this.userId});
  final String token;
  final int userId;
  @override
  State<PatientMedicationsPage> createState() => _PatientMedicationsPageState();
}

class _PatientMedicationsPageState extends State<PatientMedicationsPage> {
  final _api = const ApiService();
  bool _loading = true;
  String? _error;
  List<dynamic> _meds = [];
  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final patient = await _api.getPatient(widget.token, widget.userId);
      if (!mounted) return;
      setState(() {
        _meds      = List<dynamic>.from(patient['medications'] ?? []);
        _loading   = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          const Text(
            'My Medications',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground),
          ),
          const SizedBox(height: 20),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_error != null)
            Text(_error!, style: const TextStyle(color: Colors.red))
          else if (_meds.isEmpty)
            const Text('No medications yet.', style: TextStyle(color: _mutedForeground))
          else
            ..._meds.map((med) {
              return Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: _border)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 40, height: 40,
                          decoration: const BoxDecoration(color: _secondary, shape: BoxShape.circle),
                          alignment: Alignment.center,
                          child: Text((med['name'] ?? '?').toString()[0].toUpperCase(), style: const TextStyle(color: _primary, fontWeight: FontWeight.w700)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text((med['name'] ?? '').toString(), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: _foreground)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _DetailItem(label: 'Dose', value: (med['dose'] ?? '').toString())),
                        Expanded(child: _DetailItem(label: 'Frequency', value: (med['frequency'] ?? '').toString())),
                        Expanded(child: _DetailItem(label: 'Time', value: _formatTime((med['time'] ?? '').toString()))),
                      ],
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HISTORY PAGE
// ─────────────────────────────────────────────────────────────────────────────

class PatientHistoryPage extends StatefulWidget {
  const PatientHistoryPage({super.key, required this.token, required this.userId});
  final String token;
  final int userId;
  @override
  State<PatientHistoryPage> createState() => _PatientHistoryPageState();
}

class _PatientHistoryPageState extends State<PatientHistoryPage> {
  final _api = const ApiService();
  bool _loading = true;
  List<dynamic> _meds = [];
  Map<String, Set<int>> _takenByDate = {}; // date → set of medIds
  DateTime _weekStart = _getWeekStart(DateTime.now());

  static DateTime _getWeekStart(DateTime d) {
    final diff = d.weekday % 7; // Sunday = 0
    return DateTime(d.year, d.month, d.day - diff);
  }

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final patient = await _api.getPatient(widget.token, widget.userId);
      final meds = List<dynamic>.from(patient['medications'] ?? []);
      final Map<String, Set<int>> takenByDate = {};

      for (final med in meds) {
        final medId = med['id'] as int;
        final logs  = await _api.getMedicationLogs(widget.token, medId);
        for (final log in logs) {
          final date = log['taken_date'] as String;
          takenByDate.putIfAbsent(date, () => {}).add(medId);
        }
      }

      if (!mounted) return;
      setState(() { _meds = meds; _takenByDate = takenByDate; _loading = false; });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  bool _isTaken(int medId, String date) => _takenByDate[date]?.contains(medId) ?? false;

  Map<String, int> _weeklyStats(DateTime start, DateTime end) {
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    final cappedEnd = end.isAfter(todayDate) ? todayDate : end;

    int total = 0;
    int taken = 0;

    DateTime cur = DateTime(start.year, start.month, start.day);
    while (!cur.isAfter(cappedEnd)) {
      final dateStr = cur.toIso8601String().substring(0, 10);
      for (final med in _meds) {
        total++;
        if (_isTaken(med['id'] as int, dateStr)) taken++;
      }
      cur = cur.add(const Duration(days: 1));
    }

    final missed = total - taken;
    final adherence = total == 0 ? 0 : ((taken / total) * 100).round();

    return {
      'total': total,
      'taken': taken,
      'missed': missed,
      'adherence': adherence,
    };
  }

  int _dailyAdherence(DateTime day) {
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    final dayDate = DateTime(day.year, day.month, day.day);
    if (dayDate.isAfter(todayDate) || _meds.isEmpty) return 0;

    final dateStr = dayDate.toIso8601String().substring(0, 10);
    int taken = 0;
    for (final med in _meds) {
      if (_isTaken(med['id'] as int, dateStr)) taken++;
    }
    return ((taken / _meds.length) * 100).round();
  }

  static String _shortDate(DateTime d) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${months[d.month - 1]} ${d.day}';
  }

  static String _dayLabel(int weekday) => ['Su','Mo','Tu','We','Th','Fr','Sa'][weekday % 7];

  @override
  Widget build(BuildContext context) {
    final weekEnd  = _weekStart.add(const Duration(days: 6));
    final stats    = _weeklyStats(_weekStart, weekEnd);
    final adh      = stats['adherence'] ?? 0;
    final takenCount = stats['taken'] ?? 0;
    final missedCount = stats['missed'] ?? 0;
    final totalCount = stats['total'] ?? 0;
    final adhColor = adh >= 80 ? _accent : adh >= 60 ? _warning : _destructive;
    final today    = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: [
          const Text('Medication History', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: _foreground)),
          const SizedBox(height: 6),
          const Text('Track your weekly adherence', style: TextStyle(fontSize: 14, color: _mutedForeground)),
          const SizedBox(height: 20),

          // Week summary card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: _border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Weekly Summary',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: _foreground),
                ),
                const SizedBox(height: 14),

                // Navigation moved onto its own row so it cannot overflow.
                Row(
                  children: [
                    _NavBtn(
                      label: '←',
                      onTap: () => setState(() => _weekStart = _weekStart.subtract(const Duration(days: 7))),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _weekStart = _getWeekStart(DateTime.now())),
                        child: Container(
                          height: 44,
                          alignment: Alignment.center,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(color: _secondary, borderRadius: BorderRadius.circular(12)),
                          child: const Text(
                            'Current Week',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 14, color: _primary, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    _NavBtn(
                      label: '→',
                      onTap: _weekStart.add(const Duration(days: 7)).isBefore(todayDate)
                          ? () => setState(() => _weekStart = _weekStart.add(const Duration(days: 7)))
                          : null,
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: _secondary, borderRadius: BorderRadius.circular(16)),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${_shortDate(_weekStart)} – ${_shortDate(weekEnd)}, ${weekEnd.year}',
                              style: const TextStyle(fontSize: 14, color: _mutedForeground),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '$adh% Adherence',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: adhColor),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              totalCount == 0
                                  ? 'No doses scheduled yet'
                                  : '$takenCount taken · $missedCount missed · $totalCount total',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: _mutedForeground),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 66,
                        height: 66,
                        decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                        alignment: Alignment.center,
                        child: Text(
                          '$adh%',
                          style: TextStyle(color: adhColor, fontWeight: FontWeight.w700, fontSize: 16),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: List.generate(7, (i) {
                    final day = _weekStart.add(Duration(days: i));
                    final dayDate = DateTime(day.year, day.month, day.day);
                    final isFuture = dayDate.isAfter(todayDate);
                    final dailyAdh = _dailyAdherence(day);
                    final barHeight = isFuture ? 8.0 : 8.0 + (dailyAdh / 100) * 42.0;
                    final barColor = isFuture
                        ? _muted
                        : dailyAdh >= 80
                            ? _accent
                            : dailyAdh >= 60
                                ? _warning
                                : _destructive;

                    return Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(isFuture ? '-' : '$dailyAdh%', style: const TextStyle(fontSize: 10, color: _mutedForeground)),
                          const SizedBox(height: 6),
                          Container(
                            width: 18,
                            height: barHeight,
                            decoration: BoxDecoration(color: barColor, borderRadius: BorderRadius.circular(99)),
                          ),
                          const SizedBox(height: 6),
                          Text(_dayLabel(day.weekday), style: const TextStyle(fontSize: 10, color: _mutedForeground)),
                        ],
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_meds.isEmpty)
            const Text('No medications to display.', style: TextStyle(color: _mutedForeground))
          else ...[
            // Day headers
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: _border)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    children: [
                      const SizedBox(width: 100),
                      ...List.generate(7, (i) {
                        final day = _weekStart.add(Duration(days: i));
                        final isToday = day.year == today.year && day.month == today.month && day.day == today.day;
                        return Expanded(
                          child: Column(
                            children: [
                              Text(_dayLabel(day.weekday), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isToday ? _primary : _mutedForeground)),
                              const SizedBox(height: 2),
                              Text('${day.day}', style: TextStyle(fontSize: 11, color: isToday ? _primary : _mutedForeground)),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(height: 1, color: _border),
                  const SizedBox(height: 12),
                  // Med rows
                  ..._meds.map((med) {
                    final medId = med['id'] as int;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 100,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text((med['name'] ?? '').toString(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _foreground), maxLines: 1, overflow: TextOverflow.ellipsis),
                                Text((med['dose'] ?? '').toString(), style: const TextStyle(fontSize: 11, color: _mutedForeground)),
                              ],
                            ),
                          ),
                          ...List.generate(7, (i) {
                            final day     = _weekStart.add(Duration(days: i));
                            final dateStr = day.toIso8601String().substring(0, 10);
                            final dayDate = DateTime(day.year, day.month, day.day);
                            final isFuture = dayDate.isAfter(todayDate);
                            final taken   = !isFuture && _isTaken(medId, dateStr);
                            return Expanded(
                              child: Center(
                                child: Container(
                                  width: 24, height: 24,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isFuture ? Colors.transparent : taken ? _accent : _destructive.withOpacity(0.15),
                                  ),
                                  alignment: Alignment.center,
                                  child: isFuture
                                      ? const SizedBox()
                                      : Text(
                                          taken ? '✓' : '✗',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: taken ? Colors.white : _destructive,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _NavBtn extends StatelessWidget {
  const _NavBtn({required this.label, required this.onTap});
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: onTap != null ? _secondary : _muted,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(label, style: TextStyle(color: onTap != null ? _primary : _mutedForeground)),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED WIDGETS
// ─────────────────────────────────────────────────────────────────────────────

class _DetailItem extends StatelessWidget {
  const _DetailItem({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: _mutedForeground)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: _foreground)),
      ],
    );
  }
}
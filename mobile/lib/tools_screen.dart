import 'package:flutter/material.dart';

import 'fitknow_theme.dart';
import 'ui.dart';

class ToolsScreen extends StatefulWidget {
  const ToolsScreen({super.key, required this.cardio});

  final List<Map<String, dynamic>> cardio;

  @override
  State<ToolsScreen> createState() => _ToolsScreenState();
}

class _ToolsScreenState extends State<ToolsScreen> {
  final _weight = TextEditingController(text: '60');
  final _reps = TextEditingController(text: '8');
  final _resting = TextEditingController(text: '70');
  final _exercise = TextEditingController(text: '140');
  final _bodyWeight = TextEditingController(text: '70');

  @override
  void dispose() {
    for (final controller in [
      _weight,
      _reps,
      _resting,
      _exercise,
      _bodyWeight,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  double get _oneRm {
    final weight = double.tryParse(_weight.text) ?? 0;
    final reps = (double.tryParse(_reps.text) ?? 1).clamp(1, 30);
    return weight == 0 ? 0 : weight / (1.0278 - 0.0278 * reps);
  }

  num _nearest(num target, Iterable<num> values) =>
      values.reduce((a, b) => (b - target).abs() < (a - target).abs() ? b : a);

  String get _cardioKcal {
    final resting = double.tryParse(_resting.text) ?? 70;
    final exercise = double.tryParse(_exercise.text) ?? 140;
    final restValue = _nearest(
      resting,
      widget.cardio.map((row) => num.parse(textOf(row, 'restingHeartRate'))),
    );
    final exerciseValue = _nearest(
      exercise,
      widget.cardio.map((row) => num.parse(textOf(row, 'exerciseHeartRate'))),
    );
    final row = widget.cardio.firstWhere(
      (item) =>
          num.parse(textOf(item, 'restingHeartRate')) == restValue &&
          num.parse(textOf(item, 'exerciseHeartRate')) == exerciseValue,
      orElse: () => const {},
    );
    final weights = (row['weightKcalMap'] as Map<String, dynamic>? ?? const {});
    if (weights.isEmpty) return '—';
    final bodyWeight = double.tryParse(_bodyWeight.text) ?? 70;
    final key = _nearest(bodyWeight, weights.keys.map(num.parse)).toString();
    return weights[key]?.toString() ?? '—';
  }

  Widget _field(String label, TextEditingController controller) => Expanded(
    child: Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(labelText: label),
      ),
    ),
  );

  Widget _result(String label, String value, String unit) => Container(
    padding: const EdgeInsets.only(top: 18),
    decoration: const BoxDecoration(
      border: Border(top: BorderSide(color: FitColors.line)),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 5),
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: FitColors.accent,
            fontSize: 34,
            letterSpacing: -1.2,
            fontWeight: FontWeight.w900,
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 5),
          child: Text(
            unit,
            style: const TextStyle(color: FitColors.accent, fontSize: 13),
          ),
        ),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) => ListView(
    key: const PageStorageKey('tools'),
    keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
    children: [
      const PageHeading(kicker: 'Tools / 训练计算', title: '用数字校准训练'),
      const SectionHeading(index: '01', title: '最大力量 1RM'),
      Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 28),
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
        decoration: const BoxDecoration(
          color: FitColors.surface,
          border: Border(top: BorderSide(color: FitColors.accent, width: 2)),
        ),
        child: Column(
          children: [
            Row(
              children: [
                _field('当前重量 / kg', _weight),
                const SizedBox(width: 12),
                _field('完成次数', _reps),
              ],
            ),
            _result('预测 1RM', _oneRm.toStringAsFixed(1), 'kg'),
            const SizedBox(height: 12),
            const Text(
              '使用 Brzycki 公式估算。次数越接近力竭，结果越有参考价值。',
              style: TextStyle(
                color: FitColors.muted,
                fontSize: 10,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
      const SectionHeading(index: '02', title: '有氧消耗估算'),
      Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 40),
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
        decoration: const BoxDecoration(
          color: FitColors.surface,
          border: Border(top: BorderSide(color: FitColors.accent, width: 2)),
        ),
        child: Column(
          children: [
            Row(
              children: [
                _field('静息心率', _resting),
                const SizedBox(width: 12),
                _field('运动心率', _exercise),
              ],
            ),
            Row(children: [_field('体重 / kg', _bodyWeight), const Spacer()]),
            _result('每小时参考消耗', _cardioKcal, 'kcal'),
            const SizedBox(height: 12),
            const Text(
              '按原表中最接近的心率与体重档位查询，实际消耗会因个体和运动类型变化。',
              style: TextStyle(
                color: FitColors.muted,
                fontSize: 10,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

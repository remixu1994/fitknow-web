import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'fitknow_theme.dart';
import 'nutrition_calculator.dart';
import 'ui.dart';

class DietCalculatorScreen extends StatefulWidget {
  const DietCalculatorScreen({super.key});

  @override
  State<DietCalculatorScreen> createState() => _DietCalculatorScreenState();
}

class _DietCalculatorScreenState extends State<DietCalculatorScreen> {
  DietGoal _goal = DietGoal.fatLoss;
  BiologicalSex _sex = BiologicalSex.male;
  bool _hasStrength = true;
  final _height = TextEditingController(text: '175');
  final _weight = TextEditingController(text: '75');
  final _age = TextEditingController(text: '28');
  final _strength = TextEditingController(text: '200');
  final _cardio = TextEditingController(text: '0');
  NutritionResult? _result;

  @override
  void dispose() {
    for (final controller in [_height, _weight, _age, _strength, _cardio]) {
      controller.dispose();
    }
    super.dispose();
  }

  double _number(TextEditingController controller) =>
      double.tryParse(controller.text) ?? double.nan;

  void _calculate() {
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      _result = calculateNutrition(
        NutritionProfile(
          goal: _goal,
          sex: _sex,
          height: _number(_height),
          weight: _number(_weight),
          age: _number(_age),
          strengthCalories: _number(_strength),
          cardioCalories: _number(_cardio),
          hasStrengthTraining: _hasStrength,
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) => CustomScrollView(
    key: const PageStorageKey('diet-calculator'),
    keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
    slivers: [
      const SliverToBoxAdapter(
        child: PageHeading(kicker: 'Nutrition / 饮食计算', title: '算清楚，再开吃'),
      ),
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
        sliver: SliverList.list(
          children: [
            _GoalSwitch(
              value: _goal,
              onChanged: (goal) => setState(() {
                _goal = goal;
                _weight.text = goal == DietGoal.fatLoss ? '75' : '65';
                _result = null;
              }),
            ),
            const SizedBox(height: 24),
            const _Label('基础资料'),
            const SizedBox(height: 10),
            SegmentedButton<BiologicalSex>(
              segments: const [
                ButtonSegment(value: BiologicalSex.male, label: Text('男性')),
                ButtonSegment(value: BiologicalSex.female, label: Text('女性')),
              ],
              selected: {_sex},
              onSelectionChanged: (value) => setState(() => _sex = value.first),
              showSelectedIcon: false,
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _NumberField(
                    controller: _height,
                    label: '身高',
                    unit: 'cm',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _NumberField(
                    controller: _weight,
                    label: '体重',
                    unit: 'kg',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _NumberField(controller: _age, label: '年龄', unit: '岁'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const _Label('每日运动消耗'),
            const SizedBox(height: 6),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(
                '包含力量训练',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: const Text(
                '关闭后按无力训减脂方案计算',
                style: TextStyle(color: FitColors.muted, fontSize: 11),
              ),
              value: _hasStrength,
              onChanged: (value) => setState(() => _hasStrength = value),
            ),
            Row(
              children: [
                Expanded(
                  child: _NumberField(
                    controller: _strength,
                    label: '力量训练',
                    unit: 'kcal',
                    enabled: _hasStrength,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _NumberField(
                    controller: _cardio,
                    label: '有氧运动',
                    unit: 'kcal',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: _calculate,
              icon: const Icon(Icons.calculate_outlined),
              label: Text(_goal == DietGoal.fatLoss ? '计算减脂饮食' : '计算增肌饮食'),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                shape: const RoundedRectangleBorder(),
                textStyle: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
            const SizedBox(height: 22),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 260),
              child: _result == null
                  ? const _EmptyResult()
                  : _ResultPanel(
                      key: ValueKey(_result),
                      result: _result!,
                      goal: _goal,
                    ),
            ),
            const SizedBox(height: 18),
            const Text(
              '计算结果仅作一般健身参考，不替代医生或注册营养师建议。疾病、孕期、未成年人及饮食障碍人群请先咨询专业人士。',
              style: TextStyle(
                color: FitColors.muted,
                fontSize: 10,
                height: 1.55,
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

class _GoalSwitch extends StatelessWidget {
  const _GoalSwitch({required this.value, required this.onChanged});
  final DietGoal value;
  final ValueChanged<DietGoal> onChanged;
  @override
  Widget build(BuildContext context) => SegmentedButton<DietGoal>(
    segments: const [
      ButtonSegment(
        value: DietGoal.fatLoss,
        icon: Icon(Icons.trending_down),
        label: Text('减脂饮食'),
      ),
      ButtonSegment(
        value: DietGoal.muscleGain,
        icon: Icon(Icons.trending_up),
        label: Text('增肌饮食'),
      ),
    ],
    selected: {value},
    onSelectionChanged: (set) => onChanged(set.first),
    showSelectedIcon: false,
  );
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    style: const TextStyle(
      color: FitColors.accent,
      fontSize: 10,
      letterSpacing: 1.7,
      fontWeight: FontWeight.w900,
    ),
  );
}

class _NumberField extends StatelessWidget {
  const _NumberField({
    required this.controller,
    required this.label,
    required this.unit,
    this.enabled = true,
  });
  final TextEditingController controller;
  final String label;
  final String unit;
  final bool enabled;
  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    enabled: enabled,
    keyboardType: const TextInputType.numberWithOptions(decimal: true),
    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
    decoration: InputDecoration(labelText: label, suffixText: unit),
  );
}

class _EmptyResult extends StatelessWidget {
  const _EmptyResult();
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 28),
    decoration: const BoxDecoration(
      border: Border.symmetric(horizontal: BorderSide(color: FitColors.line)),
    ),
    child: const Row(
      children: [
        Icon(Icons.insights_outlined, color: FitColors.muted),
        SizedBox(width: 12),
        Expanded(
          child: Text(
            '填写资料并开始计算，结果会显示在这里。',
            style: TextStyle(color: FitColors.muted),
          ),
        ),
      ],
    ),
  );
}

class _ResultPanel extends StatelessWidget {
  const _ResultPanel({super.key, required this.result, required this.goal});
  final NutritionResult result;
  final DietGoal goal;
  @override
  Widget build(BuildContext context) => Container(
    color: FitColors.surface,
    padding: const EdgeInsets.all(18),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _Label('你的执行目标'),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _Stat(
                value: result.bmi.toStringAsFixed(1),
                label: 'BMI · ${result.bmiLabel}',
              ),
            ),
            Expanded(
              child: _Stat(value: '${result.bmr}', label: '基础代谢 kcal'),
            ),
            Expanded(
              child: _Stat(value: '${result.targetWeight}', label: '参考体重 kg'),
            ),
          ],
        ),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 16),
          child: Divider(height: 1),
        ),
        _DayLine(title: '力量训练日', data: result.training, highlight: true),
        const SizedBox(height: 16),
        _DayLine(title: '休息 / 纯有氧日', data: result.rest),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 16),
          child: Divider(height: 1),
        ),
        Text(
          result.advice,
          style: const TextStyle(
            color: Color(0xFFC4CCC8),
            fontSize: 12,
            height: 1.55,
          ),
        ),
      ],
    ),
  );
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});
  final String value;
  final String label;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        value,
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
      ),
      const SizedBox(height: 3),
      Text(label, style: const TextStyle(color: FitColors.muted, fontSize: 9)),
    ],
  );
}

class _DayLine extends StatelessWidget {
  const _DayLine({
    required this.title,
    required this.data,
    this.highlight = false,
  });
  final String title;
  final DayNutrition data;
  final bool highlight;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w900),
            ),
          ),
          Text(
            '${data.calories} kcal',
            style: TextStyle(
              color: highlight ? FitColors.accent : FitColors.text,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
      const SizedBox(height: 8),
      Text(
        '碳水 ${data.carbs}g  ·  蛋白质 ${data.protein}g  ·  脂肪 ${data.fat}g',
        style: const TextStyle(color: FitColors.muted, fontSize: 12),
      ),
    ],
  );
}

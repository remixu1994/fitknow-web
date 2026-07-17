import 'package:flutter/material.dart';

import 'diet_calculator_screen.dart';
import 'fitknow_theme.dart';
import 'nutrition_screen.dart';

class NutritionHubScreen extends StatefulWidget {
  const NutritionHubScreen({super.key, required this.foods});
  final List<Map<String, dynamic>> foods;

  @override
  State<NutritionHubScreen> createState() => _NutritionHubScreenState();
}

class _NutritionHubScreenState extends State<NutritionHubScreen> {
  var _index = 0;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
        child: SizedBox(
          width: double.infinity,
          child: SegmentedButton<int>(
            segments: const [
              ButtonSegment(
                value: 0,
                icon: Icon(Icons.calculate_outlined),
                label: Text('饮食计算'),
              ),
              ButtonSegment(
                value: 1,
                icon: Icon(Icons.restaurant_outlined),
                label: Text('食物数据库'),
              ),
            ],
            selected: {_index},
            onSelectionChanged: (value) => setState(() => _index = value.first),
            showSelectedIcon: false,
            style: ButtonStyle(
              side: const WidgetStatePropertyAll(
                BorderSide(color: FitColors.line),
              ),
            ),
          ),
        ),
      ),
      Expanded(
        child: IndexedStack(
          index: _index,
          children: [
            DietCalculatorScreen(),
            NutritionScreen(foods: widget.foods),
          ],
        ),
      ),
    ],
  );
}

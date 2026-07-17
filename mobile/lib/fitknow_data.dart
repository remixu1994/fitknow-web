import 'dart:convert';

import 'package:flutter/services.dart';

class FitKnowData {
  const FitKnowData({
    required this.trainingPlans,
    required this.foods,
    required this.questions,
    required this.dietPlans,
    required this.cardio,
  });

  final List<Map<String, dynamic>> trainingPlans;
  final List<Map<String, dynamic>> foods;
  final List<Map<String, dynamic>> questions;
  final List<Map<String, dynamic>> dietPlans;
  final List<Map<String, dynamic>> cardio;

  static Future<FitKnowData> load() async {
    final values = await Future.wait([
      _read('training.json'),
      _read('foods.json'),
      _read('qa.json'),
      _read('fat-loss.json'),
      _read('muscle-gain.json'),
      _read('tools.json'),
    ]);

    return FitKnowData(
      trainingPlans: _list(values[0]['trainingPlans']),
      foods: _list(values[1]['foods']),
      questions: _list(values[2]['qa']),
      dietPlans: [
        ..._list(values[3]['dietPlans']),
        ..._list(values[4]['dietPlans']),
      ],
      cardio: _list(values[5]['cardio']),
    );
  }

  static Future<Map<String, dynamic>> _read(String name) async {
    final source = await rootBundle.loadString('assets/data/$name');
    return jsonDecode(source) as Map<String, dynamic>;
  }

  static List<Map<String, dynamic>> _list(dynamic value) =>
      (value as List<dynamic>? ?? const []).cast<Map<String, dynamic>>();
}

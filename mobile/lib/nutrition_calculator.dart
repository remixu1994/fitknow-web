import 'dart:math' as math;

enum DietGoal { fatLoss, muscleGain }

enum BiologicalSex { male, female }

class NutritionProfile {
  const NutritionProfile({
    required this.goal,
    required this.sex,
    required this.height,
    required this.weight,
    required this.age,
    required this.strengthCalories,
    required this.cardioCalories,
    this.hasStrengthTraining = true,
  });

  final DietGoal goal;
  final BiologicalSex sex;
  final double height;
  final double weight;
  final double age;
  final double strengthCalories;
  final double cardioCalories;
  final bool hasStrengthTraining;
}

class DayNutrition {
  const DayNutrition({
    required this.calories,
    required this.carbs,
    required this.protein,
    required this.fat,
  });

  final int calories;
  final int carbs;
  final int protein;
  final int fat;
}

class NutritionResult {
  const NutritionResult({
    required this.bmi,
    required this.bmiLabel,
    required this.bmr,
    required this.restingExpenditure,
    required this.training,
    required this.rest,
    required this.targetWeight,
    required this.advice,
  });

  final double bmi;
  final String bmiLabel;
  final int bmr;
  final int restingExpenditure;
  final DayNutrition training;
  final DayNutrition rest;
  final int targetWeight;
  final String advice;
}

double _clamp(double value, double min, double max, double fallback) =>
    value.isFinite ? value.clamp(min, max).toDouble() : fallback;

NutritionResult calculateNutrition(NutritionProfile input) {
  final height = _clamp(input.height, 120, 230, 175);
  final weight = _clamp(input.weight, 35, 180, 70);
  final age = _clamp(input.age, 12, 80, 28);
  final strength = input.hasStrengthTraining
      ? _clamp(
          input.strengthCalories,
          0,
          800,
          input.sex == BiologicalSex.male ? 200 : 150,
        )
      : 0.0;
  final cardio = _clamp(input.cardioCalories, 0, 1200, 0);
  final heightM = height / 100;
  final bmi = weight / (heightM * heightM);
  final bmr =
      (10 * weight +
              6.25 * height -
              5 * age +
              (input.sex == BiologicalSex.male ? 5 : -161))
          .round();
  final resting = (bmr / .7).round();
  final trainingMaintenance = (resting + strength + cardio).round();
  final restMaintenance = (resting + cardio).round();
  final bmiLabel = bmi < 18.5
      ? '偏低'
      : bmi < 24
      ? '正常'
      : bmi < 28
      ? '超重'
      : '肥胖';

  if (input.goal == DietGoal.fatLoss) {
    final trainingCalories = (trainingMaintenance * .64).round();
    final restCalories = (restMaintenance * .64).round();
    final quota = _findFatLossQuota(input.sex, height, weight);
    final protein = (weight * quota.$3).round();
    final trainingCarbs = (weight * quota.$1).round();
    final restCarbs = (weight * quota.$2).round();
    return NutritionResult(
      bmi: bmi,
      bmiLabel: bmiLabel,
      bmr: bmr,
      restingExpenditure: resting,
      training: _withResidualFat(trainingCalories, trainingCarbs, protein),
      rest: _withResidualFat(restCalories, restCarbs, protein),
      targetWeight: (22 * heightM * heightM).round(),
      advice: input.hasStrengthTraining
          ? '先执行 2–3 周，结合体重、腰围与训练表现调整。若持续乏力，可增加训练日碳水。'
          : '当前按无力训方案计算；有氧消耗请填写平均到每天的数值。',
    );
  }

  final trainingCalories = (trainingMaintenance * .84).round();
  final restCalories = (restMaintenance * .84).round();
  final ratio = _lookupMuscleGainRatio(input.sex, weight, height);
  final trainingCarbs = (weight * ratio.$1).round();
  final restCarbs = (weight * ratio.$2).round();
  final protein = (weight * ratio.$3).round();
  final fat = (weight * .9).round();
  return NutritionResult(
    bmi: bmi,
    bmiLabel: bmiLabel,
    bmr: bmr,
    restingExpenditure: resting,
    training: DayNutrition(
      calories: trainingCalories,
      carbs: trainingCarbs,
      protein: protein,
      fat: fat,
    ),
    rest: DayNutrition(
      calories: restCalories,
      carbs: restCarbs,
      protein: protein,
      fat: fat,
    ),
    targetWeight: (23 * heightM * heightM).round(),
    advice: '执行 2–3 周后观察体重、围度和力量；体重不升且训练正常时，每日增加 100–150 kcal。',
  );
}

DayNutrition _withResidualFat(int calories, int carbs, int protein) {
  final fat = math.max(0, ((calories - carbs * 4 - protein * 4) / 9).round());
  return DayNutrition(
    calories: calories,
    carbs: carbs,
    protein: protein,
    fat: fat,
  );
}

typedef _Ratio = (double, double, double);

_Ratio _findFatLossQuota(BiologicalSex sex, double height, double weight) {
  final table = sex == BiologicalSex.male ? _maleFatLoss : _femaleFatLoss;
  final targetHeight = height.round();
  final candidates =
      table.entries.where((entry) => entry.key.$1 == targetHeight).toList()
        ..sort((a, b) => a.key.$2.compareTo(b.key.$2));
  if (candidates.isNotEmpty) {
    var match = candidates.first;
    for (final candidate in candidates) {
      if (candidate.key.$2 <= weight.round()) match = candidate;
    }
    return match.value;
  }
  return sex == BiologicalSex.male ? (2.5, 2.0, 1.4) : (2.3, 1.9, 1.3);
}

final Map<(int, int), _Ratio> _maleFatLoss = {
  (160, 60): (2.6, 2.0, 1.4),
  (160, 65): (2.6, 1.9, 1.4),
  (165, 65): (2.6, 2.0, 1.4),
  (170, 70): (2.6, 2.0, 1.4),
  (175, 70): (2.7, 2.1, 1.4),
  (170, 75): (2.5, 2.0, 1.4),
  (175, 75): (2.6, 2.1, 1.4),
  (180, 75): (2.7, 2.1, 1.4),
  (175, 80): (2.5, 2.0, 1.4),
  (180, 80): (2.6, 2.1, 1.4),
  (185, 80): (2.6, 2.1, 1.4),
  (180, 85): (2.5, 2.0, 1.4),
  (185, 85): (2.6, 2.1, 1.4),
  (190, 85): (2.6, 2.2, 1.4),
  (175, 90): (2.4, 2.0, 1.3),
  (180, 90): (2.5, 2.0, 1.3),
  (185, 90): (2.5, 2.1, 1.4),
  (190, 90): (2.6, 2.1, 1.4),
};

final Map<(int, int), _Ratio> _femaleFatLoss = {
  (150, 45): (2.4, 1.8, 1.3),
  (150, 50): (2.3, 1.8, 1.2),
  (155, 50): (2.4, 1.9, 1.3),
  (160, 50): (2.5, 2.0, 1.3),
  (150, 55): (2.2, 1.8, 1.2),
  (155, 55): (2.3, 1.9, 1.2),
  (160, 55): (2.4, 1.9, 1.3),
  (165, 55): (2.5, 2.0, 1.3),
  (160, 60): (2.3, 1.9, 1.2),
  (165, 60): (2.4, 2.0, 1.3),
  (170, 60): (2.5, 2.1, 1.3),
  (170, 65): (2.4, 2.0, 1.3),
  (175, 65): (2.5, 2.1, 1.3),
  (170, 70): (2.3, 2.0, 1.2),
  (175, 70): (2.4, 2.0, 1.3),
  (180, 70): (2.4, 2.1, 1.3),
};

_Ratio _lookupMuscleGainRatio(BiologicalSex sex, double weight, double height) {
  final table = sex == BiologicalSex.male ? _maleMuscleGain : _femaleMuscleGain;
  var best = table.keys.first;
  for (final key in table.keys) {
    final score = (key.$1 - weight).abs() + (key.$2 - height).abs() / 5;
    final bestScore = (best.$1 - weight).abs() + (best.$2 - height).abs() / 5;
    if (score < bestScore) best = key;
  }
  return table[best]!;
}

final Map<(int, int), _Ratio> _maleMuscleGain = _expand({
  50: [4.0, 3.0, 1.7],
  55: [3.8, 2.9, 1.6],
  60: [3.7, 2.8, 1.6],
  65: [3.6, 2.8, 1.5],
  70: [3.5, 2.7, 1.5],
  75: [3.6, 2.9, 1.5],
  80: [3.5, 2.9, 1.5],
  85: [3.5, 2.9, 1.5],
  90: [3.5, 2.9, 1.5],
}, male: true);

final Map<(int, int), _Ratio> _femaleMuscleGain = _expand({
  40: [3.3, 2.5, 1.4],
  45: [3.2, 2.5, 1.4],
  50: [3.1, 2.4, 1.3],
  55: [3.0, 2.4, 1.3],
  60: [3.1, 2.6, 1.3],
  65: [3.2, 2.7, 1.4],
  70: [3.2, 2.7, 1.4],
  75: [3.2, 2.8, 1.4],
}, male: false);

Map<(int, int), _Ratio> _expand(
  Map<int, List<double>> rows, {
  required bool male,
}) {
  final result = <(int, int), _Ratio>{};
  final heights = male
      ? [160, 165, 170, 175, 180, 185, 190]
      : [150, 155, 160, 165, 170, 175, 180];
  for (final row in rows.entries) {
    for (final height in heights) {
      final heightSteps = (height - heights.first) / 5;
      result[(row.key, height)] = (
        row.value[0] + heightSteps * .12,
        row.value[1] + heightSteps * .1,
        row.value[2] + heightSteps * .05,
      );
    }
  }
  return result;
}

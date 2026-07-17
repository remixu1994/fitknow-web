import 'package:fitknow_mobile/nutrition_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('computes male fat-loss training and rest targets', () {
    final result = calculateNutrition(
      const NutritionProfile(
        goal: DietGoal.fatLoss,
        sex: BiologicalSex.male,
        height: 175,
        weight: 75,
        age: 28,
        strengthCalories: 200,
        cardioCalories: 0,
      ),
    );
    expect(result.bmi.toStringAsFixed(1), '24.5');
    expect(result.bmr, 1709);
    expect(result.training.calories, 1690);
    expect(result.rest.calories, 1562);
    expect(result.training.carbs, 195);
    expect(result.training.protein, 105);
  });

  test('computes muscle-gain macro targets', () {
    final result = calculateNutrition(
      const NutritionProfile(
        goal: DietGoal.muscleGain,
        sex: BiologicalSex.male,
        height: 175,
        weight: 65,
        age: 28,
        strengthCalories: 200,
        cardioCalories: 0,
      ),
    );
    expect(result.bmr, 1609);
    expect(result.training.calories, 2099);
    expect(result.training.protein, greaterThan(100));
    expect(result.training.carbs, greaterThan(result.rest.carbs));
  });

  test('removes strength calories when strength training is disabled', () {
    final result = calculateNutrition(
      const NutritionProfile(
        goal: DietGoal.fatLoss,
        sex: BiologicalSex.female,
        height: 165,
        weight: 60,
        age: 30,
        strengthCalories: 500,
        cardioCalories: 100,
        hasStrengthTraining: false,
      ),
    );
    expect(result.training.calories, result.rest.calories);
  });
}

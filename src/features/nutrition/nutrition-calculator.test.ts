import { describe, expect, it } from 'vitest';

import type { DietPlan, Meal, MealTable, Profile } from '../../types';
import {
  clampNumber,
  computeMealTargets,
  computeNutrition,
  dayLabel,
  findFatLossQuota,
  isNoStrengthPlan,
  targetCaloriesForTable,
} from './nutrition-calculator';

const profile: Profile = {
  sex: 'male',
  height: '175',
  weight: '75',
  age: '28',
  strengthCalories: '200',
  cardioCalories: '0',
};

const trainingTable: MealTable = {
  dayType: 'training',
  title: '力训日',
  meals: [],
};

const breakfast: Meal = {
  order: '1',
  name: '早餐',
  mealTypeLabel: '早餐',
  carbPercent: 25,
  proteinPercent: 20,
  carbOptions: [],
  proteinOptions: [],
  fatNote: '',
  produceNote: '',
};

describe('nutrition-calculator', () => {
  it('clamps profile inputs to safe numeric ranges', () => {
    expect(clampNumber('bad', 120, 230, 175)).toBe(175);
    expect(clampNumber('90', 120, 230, 175)).toBe(120);
    expect(clampNumber('240', 120, 230, 175)).toBe(230);
  });

  it('matches fat-loss quota tables by exact and lower-or-equal weight', () => {
    expect(findFatLossQuota('male', 175, 75, false)).toMatchObject({
      key: '175-75',
      trainingCarb: 2.6,
      restCarb: 2.1,
      protein: 1.4,
      isExact: true,
    });

    expect(findFatLossQuota('male', 175, 77, false)).toMatchObject({
      key: '175-75',
      matchedWeight: 75,
      isExact: false,
    });
  });

  it('computes fat-loss calories and macro meal targets from quota tables', () => {
    const metrics = computeNutrition('fat-loss', profile);
    const target = computeMealTargets(metrics, trainingTable, breakfast);

    expect(metrics).toMatchObject({
      bmiText: '24.5',
      bmiLabel: '超重',
      bmr: 1709,
      restingExpenditure: 2441,
      trainingTargetCalories: 1690,
      restTargetCalories: 1562,
      primaryTargetCalories: 1690,
    });
    expect(target).toEqual({
      carbTotal: 195,
      proteinTotal: 105,
      carb: 48.75,
      protein: 21,
    });
    expect(targetCaloriesForTable(metrics, 'training')).toBe(1690);
  });

  it('handles no-strength fat-loss plans as daily targets', () => {
    const plan = { title: '无力训者饮食模板' } as DietPlan;
    const metrics = computeNutrition('fat-loss', profile, plan);

    expect(isNoStrengthPlan(plan)).toBe(true);
    expect(metrics.strengthCalories).toBe(0);
    expect(metrics.targetCalories).toBe(1562);
    expect(dayLabel('daily')).toBe('每日');
  });

  it('computes muscle-gain macros from ratio tables', () => {
    const metrics = computeNutrition('muscle-gain', {
      ...profile,
      weight: '65',
    });

    expect(metrics).toMatchObject({
      bmiText: '21.2',
      bmiLabel: '正常',
      bmr: 1609,
      restingExpenditure: 2299,
      trainingTargetCalories: 2099,
      protein: 111,
      fat: 59,
      carbs: 254,
      restCarbs: 202,
    });
  });
});

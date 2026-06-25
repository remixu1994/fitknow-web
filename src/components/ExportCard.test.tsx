import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ExportCard from './ExportCard';
import type { DietPlan, NutritionMetrics, Profile } from '../types';

const profile: Profile = {
  sex: 'male',
  height: '175',
  weight: 'not-a-number',
  age: '28',
  strengthCalories: '200',
  cardioCalories: '0',
};

const plan: DietPlan = {
  id: 'fat-loss-training',
  sheetIndex: 1,
  title: '减脂-午饭前练',
  goal: 'fat-loss',
  timing: '午饭前练',
  summary: '',
  inputs: [],
  sourceRefs: [],
};

const metrics: NutritionMetrics = {
  bmiText: '24.5',
  bmiLabel: '正常',
  goal: 'fat-loss',
  sex: 'male',
  height: 175,
  weight: 75,
  bmr: 1700,
  restingExpenditure: 2440,
  strengthCalories: 200,
  cardioCalories: 0,
  maintenanceCalories: 2440,
  trainingMaintenanceCalories: 2640,
  targetCalories: 1562,
  trainingTargetCalories: 1690,
  restTargetCalories: 1562,
  primaryTargetCalories: 1690,
  quotaMatch: {
    key: 'male-175-75',
    sex: 'male',
    noStrength: false,
    matchedHeight: 175,
    matchedWeight: 75,
    isExact: true,
    trainingCarb: 2.6,
    restCarb: 1.7,
    protein: 2.1,
  },
  advice: '',
  targetWeightText: '目标体重参考 BMI',
};

describe('ExportCard', () => {
  it('uses clamped metrics weight for exported macro grams', () => {
    const html = renderToStaticMarkup(<ExportCard profile={profile} metrics={metrics} plan={plan} platform="wechat" />);

    expect(html).toContain('195 g');
    expect(html).toContain('158 g');
    expect(html).not.toContain('0 g');
  });

  it('uses matching training-day maintenance calories for exported deficit', () => {
    const html = renderToStaticMarkup(<ExportCard profile={profile} metrics={metrics} plan={plan} platform="wechat" />);

    expect(html).toContain('950 kcal');
    expect(html).not.toContain('750 kcal');
  });
});

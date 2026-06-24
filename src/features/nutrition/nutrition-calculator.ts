import {
  femaleMuscleGainRatios,
  lookupRatio,
  maleFatLossRatios,
  maleMuscleGainRatios,
} from '../../lib/fitness-ratios';
import type {
  DietPlan,
  DietProfile,
  Meal,
  MealTable,
  MealTarget,
  NutritionMetrics,
  NutritionResult,
  Profile,
  QuotaMatch,
} from '../../types';

type FatLossTrainingQuota = {
  trainingCarb: number;
  restCarb: number;
  protein: number;
};

type FatLossNoStrengthQuota = {
  dailyCarb: number;
  protein: number;
};

type FatLossQuotaTables = {
  training: Record<'male' | 'female', Record<string, FatLossTrainingQuota>>;
  noStrength: Record<'male' | 'female', Record<string, FatLossNoStrengthQuota>>;
};

const fatLossQuotaTables: FatLossQuotaTables = {
  training: {
    male: {
      '160-60': { trainingCarb: 2.6, restCarb: 2.0, protein: 1.4 },
      '160-65': { trainingCarb: 2.6, restCarb: 1.9, protein: 1.4 },
      '165-65': { trainingCarb: 2.6, restCarb: 2.0, protein: 1.4 },
      '170-70': { trainingCarb: 2.6, restCarb: 2.0, protein: 1.4 },
      '175-70': { trainingCarb: 2.7, restCarb: 2.1, protein: 1.4 },
      '170-75': { trainingCarb: 2.5, restCarb: 2.0, protein: 1.4 },
      '175-75': { trainingCarb: 2.6, restCarb: 2.1, protein: 1.4 },
      '180-75': { trainingCarb: 2.7, restCarb: 2.1, protein: 1.4 },
      '175-80': { trainingCarb: 2.5, restCarb: 2.0, protein: 1.4 },
      '180-80': { trainingCarb: 2.6, restCarb: 2.1, protein: 1.4 },
      '185-80': { trainingCarb: 2.6, restCarb: 2.1, protein: 1.4 },
      '180-85': { trainingCarb: 2.5, restCarb: 2.0, protein: 1.4 },
      '185-85': { trainingCarb: 2.6, restCarb: 2.1, protein: 1.4 },
      '190-85': { trainingCarb: 2.6, restCarb: 2.2, protein: 1.4 },
      '175-90': { trainingCarb: 2.4, restCarb: 2.0, protein: 1.3 },
      '180-90': { trainingCarb: 2.5, restCarb: 2.0, protein: 1.3 },
      '185-90': { trainingCarb: 2.5, restCarb: 2.1, protein: 1.4 },
      '190-90': { trainingCarb: 2.6, restCarb: 2.1, protein: 1.4 },
    },
    female: {
      '150-45': { trainingCarb: 2.4, restCarb: 1.8, protein: 1.3 },
      '150-50': { trainingCarb: 2.3, restCarb: 1.8, protein: 1.2 },
      '155-50': { trainingCarb: 2.4, restCarb: 1.9, protein: 1.3 },
      '160-50': { trainingCarb: 2.5, restCarb: 2.0, protein: 1.3 },
      '150-55': { trainingCarb: 2.2, restCarb: 1.8, protein: 1.2 },
      '155-55': { trainingCarb: 2.3, restCarb: 1.9, protein: 1.2 },
      '160-55': { trainingCarb: 2.4, restCarb: 1.9, protein: 1.3 },
      '165-55': { trainingCarb: 2.5, restCarb: 2.0, protein: 1.3 },
      '160-60': { trainingCarb: 2.3, restCarb: 1.9, protein: 1.2 },
      '165-60': { trainingCarb: 2.4, restCarb: 2.0, protein: 1.3 },
      '170-60': { trainingCarb: 2.5, restCarb: 2.1, protein: 1.3 },
      '170-65': { trainingCarb: 2.4, restCarb: 2.0, protein: 1.3 },
      '175-65': { trainingCarb: 2.5, restCarb: 2.1, protein: 1.3 },
      '170-70': { trainingCarb: 2.3, restCarb: 2.0, protein: 1.2 },
      '175-70': { trainingCarb: 2.4, restCarb: 2.0, protein: 1.3 },
      '180-70': { trainingCarb: 2.4, restCarb: 2.1, protein: 1.3 },
    },
  },
  noStrength: {
    male: {
      '160-60': { dailyCarb: 2.4, protein: 1.0 },
      '160-65': { dailyCarb: 2.3, protein: 1.0 },
      '165-65': { dailyCarb: 2.4, protein: 1.0 },
      '160-70': { dailyCarb: 2.3, protein: 1.0 },
      '165-70': { dailyCarb: 2.3, protein: 1.0 },
      '170-70': { dailyCarb: 2.4, protein: 1.0 },
      '175-70': { dailyCarb: 2.5, protein: 1.1 },
      '170-75': { dailyCarb: 2.4, protein: 1.0 },
      '175-75': { dailyCarb: 2.4, protein: 1.0 },
      '180-75': { dailyCarb: 2.5, protein: 1.1 },
      '175-80': { dailyCarb: 2.4, protein: 1.0 },
      '180-80': { dailyCarb: 2.4, protein: 1.0 },
      '185-80': { dailyCarb: 2.5, protein: 1.1 },
    },
    female: {
      '150-45': { dailyCarb: 2.2, protein: 1.1 },
      '150-50': { dailyCarb: 2.1, protein: 1.1 },
      '155-50': { dailyCarb: 2.1, protein: 0.9 },
      '160-50': { dailyCarb: 2.1, protein: 1.2 },
      '150-55': { dailyCarb: 2.1, protein: 1.0 },
      '155-55': { dailyCarb: 2.0, protein: 0.9 },
      '160-55': { dailyCarb: 2.1, protein: 1.1 },
      '165-55': { dailyCarb: 2.2, protein: 1.2 },
      '155-60': { dailyCarb: 2.0, protein: 0.9 },
      '160-60': { dailyCarb: 2.0, protein: 1.1 },
      '165-60': { dailyCarb: 2.1, protein: 1.1 },
      '170-60': { dailyCarb: 2.2, protein: 1.2 },
      '165-65': { dailyCarb: 2.1, protein: 1.1 },
      '170-65': { dailyCarb: 2.1, protein: 1.2 },
      '175-65': { dailyCarb: 2.2, protein: 1.2 },
      '180-65': { dailyCarb: 2.3, protein: 1.2 },
    },
  },
};

export const defaultProfiles: Record<DietPlan['goal'], DietProfile> = {
  'fat-loss': { sex: 'male', height: '175', weight: '75', age: '28', strengthCalories: '200', cardioCalories: '0' },
  'muscle-gain': { sex: 'male', height: '175', weight: '65', age: '28', strengthCalories: '200', cardioCalories: '0' },
};

export function clampNumber(value: string | number | undefined, min: number, max: number, fallback: number): number {
  const number = Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function isNoStrengthPlan(plan?: Pick<DietPlan, 'title'> | null): boolean {
  return plan?.title?.includes('无力训者') ?? false;
}

function roundedKey(value: string | number): string {
  return String(Math.round(Number(value) || 0));
}

export function findFatLossQuota(sex: 'male' | 'female', height: number, weight: number, noStrength: boolean): QuotaMatch | null {
  const tableGroup = noStrength ? fatLossQuotaTables.noStrength : fatLossQuotaTables.training;
  const heightKey = roundedKey(height);
  const weightValue = Math.round(Number(weight) || 0);
  const entries = Object.entries(tableGroup[sex] || {})
    .map(([key, entry]) => {
      const [entryHeight, entryWeight] = key.split('-').map(Number);
      return { key, entry, height: entryHeight, weight: entryWeight };
    })
    .filter((item) => String(item.height) === heightKey)
    .sort((a, b) => a.weight - b.weight);
  if (!entries.length) return null;
  const exact = entries.find((item) => item.weight === weightValue);
  const lowerOrEqual = entries.filter((item) => item.weight <= weightValue).at(-1);
  const match = exact || lowerOrEqual || entries[0];
  const entry = match.entry;
  if (!entry) return null;
  return {
    ...entry,
    key: match.key,
    sex,
    noStrength,
    matchedHeight: match.height,
    matchedWeight: match.weight,
    isExact: exact != null,
  };
}

export function computeNutrition(goal: DietPlan['goal'], profile: Profile, plan?: DietPlan): NutritionResult {
  const sex = profile.sex === 'female' ? 'female' : 'male';
  const height = clampNumber(profile.height, 120, 230, 175);
  const weight = clampNumber(profile.weight, 35, 180, 70);
  const age = clampNumber(profile.age, 12, 80, 28);
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161));
  const bmiLabel = bmi < 18.5 ? '偏低' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
  const targetWeight = Math.round((goal === 'fat-loss' ? 22 : 23) * heightM * heightM);

  if (goal === 'fat-loss') {
    const noStrength = isNoStrengthPlan(plan);
    const strengthCalories = noStrength ? 0 : clampNumber(profile.strengthCalories, 0, 800, sex === 'male' ? 200 : 150);
    const cardioCalories = clampNumber(profile.cardioCalories, 0, 1200, 0);
    const restingExpenditure = Math.round(bmr / 0.7);
    const maintenanceCalories = Math.round(restingExpenditure + cardioCalories);
    const trainingMaintenanceCalories = Math.round(restingExpenditure + strengthCalories + cardioCalories);
    const restMaintenanceCalories = maintenanceCalories;
    const targetCalories = Math.round(maintenanceCalories * 0.64);
    const trainingTargetCalories = Math.round(trainingMaintenanceCalories * 0.64);
    const restTargetCalories = Math.round(restMaintenanceCalories * 0.64);
    const quotaMatch = findFatLossQuota(sex, height, weight, noStrength);
    const advice = noStrength
      ? `每日应吃热量 = (${restingExpenditure} + ${cardioCalories}) × 0.64 ≈ ${targetCalories} kcal。有氧消耗请填平均到每天的数值。`
      : `力训日应吃热量 = (${restingExpenditure} + ${strengthCalories} + ${cardioCalories}) × 0.64 ≈ ${trainingTargetCalories} kcal；休息日应吃热量 = (${restingExpenditure} + ${cardioCalories}) × 0.64 ≈ ${restTargetCalories} kcal。`;
    return {
      bmiText: Number.isFinite(bmi) ? bmi.toFixed(1) : '-',
      bmiLabel,
      goal,
      sex,
      height,
      weight,
      bmr,
      restingExpenditure,
      strengthCalories,
      cardioCalories,
      maintenanceCalories,
      targetCalories,
      trainingMaintenanceCalories,
      restMaintenanceCalories,
      trainingTargetCalories,
      restTargetCalories,
      primaryTargetCalories: noStrength ? targetCalories : trainingTargetCalories,
      quotaMatch,
      advice,
      targetWeightText: `以 BMI 约 22 估算，阶段目标体重可先看 ${targetWeight} kg 附近；若已有伤病或代谢问题，优先咨询专业人士。`,
    };
  }

  const strengthCalories = clampNumber(profile.strengthCalories, 0, 800, sex === 'male' ? 200 : 150);
  const cardioCalories = clampNumber(profile.cardioCalories, 0, 1200, 0);
  const restingExpenditure = Math.round(bmr / 0.7);
  const tdee = Math.round(restingExpenditure + strengthCalories + cardioCalories);
  const restMaintenanceCalories = Math.round(restingExpenditure + cardioCalories);
  const trainingMaintenanceCalories = tdee;
  const restTargetCalories = Math.round(restMaintenanceCalories * 0.84);
  const trainingTargetCalories = Math.round(trainingMaintenanceCalories * 0.84);
  const minimumCalories = sex === 'male' ? 1500 : 1200;
  const targetCalories = Math.max(trainingTargetCalories, minimumCalories);

  const table = sex === "female" ? femaleMuscleGainRatios : maleMuscleGainRatios;
  const [muscleGainCarbsRate, muscleGainRestCarbsRate, muscleGainProteinRate] = lookupRatio(table, weight, height);
  let carbsRate = muscleGainCarbsRate;
  let restCarbsRate = muscleGainRestCarbsRate;
  let proteinRate = muscleGainProteinRate;
  const fatRate = 0.9;

  let trainingCarbs;
  let trainingProtein;
  let trainingFat;
  let restCarbs;
  let restProtein;
  let restFat;

  if (carbsRate > 0) {
    trainingCarbs = Math.round(weight * carbsRate);
    trainingProtein = Math.round(weight * proteinRate);
    trainingFat = Math.round(weight * fatRate);
    restCarbs = Math.round(weight * restCarbsRate);
    restProtein = trainingProtein;
    restFat = trainingFat;
  } else {
    const protein = Math.round(weight * proteinRate);
    const fat = Math.round(weight * fatRate);
    const carbs = Math.max(0, Math.round((targetCalories - protein * 4 - fat * 9) / 4));
    trainingCarbs = carbs;
    trainingProtein = protein;
    trainingFat = fat;
    restCarbs = Math.round(carbs * 0.82);
    restProtein = protein;
    restFat = fat;
    carbsRate = carbs / weight;
  }

  const protein = trainingProtein;
  const fat = trainingFat;
  const carbs = trainingCarbs;
  const advice = `力训日应吃热量 = (${restingExpenditure} + ${strengthCalories} + ${cardioCalories}) × 0.84 ≈ ${trainingTargetCalories} kcal；休息日应吃热量 = (${restingExpenditure} + ${cardioCalories}) × 0.84 ≈ ${restTargetCalories} kcal。执行 2-3 周后看体重、围度和训练表现，若体重不上升，再按问答建议增加 100-150 kcal。`;
  const targetWeightText = `以 BMI 约 23 估算，长期体重上限可先参考 ${targetWeight} kg 附近，优先保证围度和力量质量。`;

  return {
    bmiText: Number.isFinite(bmi) ? bmi.toFixed(1) : '-',
    bmiLabel,
    goal,
    sex,
    height,
    weight,
    bmr,
    restingExpenditure,
    strengthCalories,
    cardioCalories,
    tdee,
    trainingMaintenanceCalories,
    restMaintenanceCalories,
    trainingTargetCalories,
    restTargetCalories,
    primaryTargetCalories: trainingTargetCalories,
    targetCalories,
    quotaMatch: null,
    protein,
    fat,
    carbs,
    carbsRate: Math.round(carbsRate * 100) / 100,
    restCarbsRate: Math.round(restCarbsRate * 100) / 100,
    proteinRate: Math.round(proteinRate * 100) / 100,
    fatRate: Math.round(fatRate * 100) / 100,
    trainingCarbs,
    trainingProtein,
    trainingFat,
    restCarbs,
    restProtein,
    restFat,
    advice,
    targetWeightText,
  };
}

export function dayLabel(dayType: MealTable['dayType']): string {
  if (dayType === 'training') return '力训日';
  if (dayType === 'rest') return '休息日';
  return '每日';
}

export function computeMealTargets(metrics: NutritionMetrics, table: MealTable, meal: Meal): MealTarget | null {
  let carbTotal: number | undefined;
  let proteinTotal: number | undefined;

  if (metrics.quotaMatch) {
    const quotaCarb = table.dayType === 'training'
      ? metrics.quotaMatch.trainingCarb
      : table.dayType === 'rest'
        ? metrics.quotaMatch.restCarb
        : metrics.quotaMatch.dailyCarb;
    if (quotaCarb === undefined) return null;
    carbTotal = quotaCarb * metrics.weight;
    proteinTotal = metrics.quotaMatch.protein * metrics.weight;
  } else {
    carbTotal = table.dayType === 'rest' ? metrics.restCarbs : metrics.trainingCarbs;
    proteinTotal = table.dayType === 'rest' ? metrics.restProtein : metrics.trainingProtein;
  }

  const resolvedCarbTotal = carbTotal;
  const resolvedProteinTotal = proteinTotal;
  if (resolvedCarbTotal === undefined || resolvedProteinTotal === undefined) return null;
  if (!Number.isFinite(resolvedCarbTotal) || !Number.isFinite(resolvedProteinTotal)) return null;

  return {
    carbTotal: resolvedCarbTotal,
    proteinTotal: resolvedProteinTotal,
    carb: (resolvedCarbTotal * meal.carbPercent) / 100,
    protein: (resolvedProteinTotal * meal.proteinPercent) / 100,
  };
}

export function targetCaloriesForTable(metrics: NutritionMetrics, dayType: MealTable['dayType']): number | undefined {
  if (dayType === 'training') return metrics.trainingTargetCalories;
  if (dayType === 'rest') return metrics.restTargetCalories;
  return metrics.targetCalories;
}

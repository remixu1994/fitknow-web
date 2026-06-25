import type { Food, FoodConversionResult, FoodRateInfo } from '../../types';

export function convertFoodWeight(targetGrams: number, food?: Food): FoodConversionResult | null {
  if (!Number.isFinite(targetGrams) || !food?.rate) return null;
  const parsed = parseFoodRate(food);
  if (!parsed) return null;
  if (parsed.mode === 'unit') {
    const count = targetGrams / parsed.rate;
    return {
      value: count < 10 ? Math.round(count * 10) / 10 : Math.round(count),
      unit: parsed.unit,
    };
  }
  return {
    value: Math.round(targetGrams / parsed.rate),
    unit: 'g',
  };
}

export function parseFoodRate(food?: Food): FoodRateInfo | null {
  if (!food?.rate) return null;
  const rateText = String(food.rate);
  const unitMatch = rateText.match(/^(\d+(?:\.\d+)?)g\/(.+)$/);
  if (unitMatch) {
    const rate = Number.parseFloat(unitMatch[1]);
    return rate ? { mode: 'unit', rate, unit: unitMatch[2] } : null;
  }
  const rate = Number.parseFloat(rateText);
  return rate ? { mode: 'gram', rate, unit: 'g' } : null;
}

export function computeFoodMacro(amount: string, food?: Food): number {
  const value = Number.parseFloat(amount);
  const parsed = parseFoodRate(food);
  if (!Number.isFinite(value) || value <= 0 || !parsed) return 0;
  return value * parsed.rate;
}

export function foodInputUnit(food?: Food): string {
  return parseFoodRate(food)?.unit || 'g';
}

export function suggestedFoodAmount(target?: number, food?: Food): string {
  const amount = convertFoodWeight(Number(target), food);
  return amount ? String(amount.value) : '';
}

export function suggestedMacroAmount(amount: string, food?: Food): string {
  const macro = computeFoodMacro(amount, food);
  if (!macro) return '';
  return macro < 10 ? String(Math.round(macro * 10) / 10) : String(Math.round(macro));
}

export function reverseFoodAmount(macro: string, food?: Food): string {
  const value = Number.parseFloat(macro);
  const amount = convertFoodWeight(value, food);
  return amount ? String(amount.value) : '';
}

export function foodOptionLabel(food: Food): string {
  return `${food.name} · ${food.rate}`;
}

export function findFoodByQuery(query: string, foods: Food[], fuzzy = false): Food | null {
  const text = `${query || ''}`.trim();
  if (!text) return null;
  const compactText = text.replace(/\s+/g, '');
  const exact = foods.find((food) => foodOptionLabel(food) === text || food.name === text);
  if (exact || !fuzzy) return exact || null;
  return foods.find((food) => {
    const name = food.name.replace(/\s+/g, '');
    const label = foodOptionLabel(food).replace(/\s+/g, '');
    return name.includes(compactText) || label.includes(compactText);
  }) || null;
}

function foodMatchesOption(food: Food, option: string): boolean {
  const text = `${option || ''}`.replace(/\s+/g, '');
  const name = `${food.name}`.replace(/\s+/g, '');
  return Boolean(text && (text.includes(name) || name.includes(text.slice(0, Math.min(4, text.length)))));
}

export function findDefaultFood(options: string[] = [], macroType: string, foods: Food[] = []): Food | undefined {
  const macroFoods = foods.filter((food) => food.macroType === macroType);
  const optionMatch = macroFoods.find((food) => options.some((option) => foodMatchesOption(food, option)));
  if (optionMatch) return optionMatch;
  const fallbackNames = macroType === '碳水'
    ? ['米饭（很软）', '米饭（一般）']
    : ['鸡蛋', '鸡胸肉', '瘦猪肉', '瘦牛肉'];
  return macroFoods.find((food) => fallbackNames.some((name) => food.name.includes(name))) || macroFoods[0];
}

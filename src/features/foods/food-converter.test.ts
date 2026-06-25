import { describe, expect, it } from 'vitest';

import type { Food } from '../../types';
import {
  computeFoodMacro,
  convertFoodWeight,
  findDefaultFood,
  findFoodByQuery,
  foodInputUnit,
  foodOptionLabel,
  parseFoodRate,
  reverseFoodAmount,
  suggestedFoodAmount,
  suggestedMacroAmount,
} from './food-converter';

const rice: Food = {
  id: 'rice',
  macroType: '碳水',
  group: '主食',
  name: '米饭（一般）',
  rate: '2.6',
  giOrPosition: '',
  explanation: '',
  sourceRefs: [],
};

const egg: Food = {
  id: 'egg',
  macroType: '蛋白质',
  group: '蛋类',
  name: '鸡蛋',
  rate: '6g/个',
  giOrPosition: '',
  explanation: '',
  sourceRefs: [],
};

describe('food-converter', () => {
  it('parses gram and unit based food rates', () => {
    expect(parseFoodRate(rice)).toEqual({ mode: 'gram', rate: 2.6, unit: 'g' });
    expect(parseFoodRate(egg)).toEqual({ mode: 'unit', rate: 6, unit: '个' });
    expect(foodInputUnit(egg)).toBe('个');
  });

  it('converts macro targets into user-facing food amounts', () => {
    expect(convertFoodWeight(52, rice)).toEqual({ value: 20, unit: 'g' });
    expect(convertFoodWeight(15, egg)).toEqual({ value: 2.5, unit: '个' });
    expect(suggestedFoodAmount(15, egg)).toBe('2.5');
  });

  it('converts entered food amounts back into macro grams', () => {
    expect(computeFoodMacro('2.5', egg)).toBe(15);
    expect(suggestedMacroAmount('2.5', egg)).toBe('15');
    expect(reverseFoodAmount('15', egg)).toBe('2.5');
  });

  it('finds foods by exact label, fuzzy query, and macro fallback', () => {
    const foods = [rice, egg];

    expect(foodOptionLabel(rice)).toBe('米饭（一般） · 2.6');
    expect(findFoodByQuery('米饭（一般） · 2.6', foods)).toBe(rice);
    expect(findFoodByQuery('米饭', foods, true)).toBe(rice);
    expect(findDefaultFood([], '蛋白质', foods)).toBe(egg);
  });
});

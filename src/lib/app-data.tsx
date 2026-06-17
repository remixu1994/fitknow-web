import { createContext, useContext } from 'react';
import type { CoreData, DietPlan, TrainingPlan, Food, QA, AnatomyData, CardioEntry, OneRepMaxEntry, DashboardSearch } from '../types';

export type AppData = CoreData & {
  dietPlans?: DietPlan[];
  trainingPlans?: TrainingPlan[];
  foods?: Food[];
  qa?: QA[];
  anatomy?: AnatomyData;
  cardio?: CardioEntry[];
  oneRepMax?: OneRepMaxEntry[];
  dashboardSearch?: DashboardSearch;
  loadError?: Error;
};

export const DataContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const data = useContext(DataContext);
  if (!data) {
    throw new Error('FitKnow data has not loaded yet.');
  }
  return data;
}

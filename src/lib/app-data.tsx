import { createContext, useContext } from 'react';

export type AppData = Record<string, any>;

export const DataContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const data = useContext(DataContext);
  if (!data) {
    throw new Error('FitKnow data has not loaded yet.');
  }
  return data;
}

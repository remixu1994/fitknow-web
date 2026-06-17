import type { AppData } from './app-data';

export type RouteKey =
  | 'dashboard'
  | 'fat-loss'
  | 'muscle-gain'
  | 'training'
  | 'tools'
  | 'foods'
  | 'qa'
  | 'anatomy'
  | 'source';

type JsonModule<T = AppData> = { default: T };
type JsonLoader<T = AppData> = () => Promise<JsonModule<T>>;
type RouteLoader = (args: { query: string }) => Promise<Record<string, any>>;

export const routeFromHash = (): string => (window.location.hash || '#/').replace('#/', '') || 'dashboard';

const loadJson = <T = AppData>(loader: JsonLoader<T>): Promise<T> => loader().then((module) => module.default);

export const coreLoader = (): Promise<AppData> => loadJson(() => import('../data/generated/core.json'));

export const routeLoaders: Record<RouteKey, RouteLoader> = {
  dashboard: async ({ query }) => {
    const [tools, dashboardSearch] = await Promise.all([
      loadJson(() => import('../data/generated/tools.json')),
      query.trim() ? loadJson(() => import('../data/generated/dashboard-search.json')) : Promise.resolve(null),
    ]);
    return dashboardSearch ? { ...tools, dashboardSearch } : tools;
  },
  'fat-loss': async () => {
    const [diet, foods, qa] = await Promise.all([
      loadJson(() => import('../data/generated/fat-loss.json')),
      loadJson(() => import('../data/generated/foods.json')),
      loadJson(() => import('../data/generated/qa.json')),
    ]);
    return { ...diet, ...foods, ...qa };
  },
  'muscle-gain': async () => {
    const [diet, foods, qa] = await Promise.all([
      loadJson(() => import('../data/generated/muscle-gain.json')),
      loadJson(() => import('../data/generated/foods.json')),
      loadJson(() => import('../data/generated/qa.json')),
    ]);
    return { ...diet, ...foods, ...qa };
  },
  training: () => loadJson(() => import('../data/generated/training.json')),
  tools: async () => {
    const [tools, foods] = await Promise.all([
      loadJson(() => import('../data/generated/tools.json')),
      loadJson(() => import('../data/generated/foods.json')),
    ]);
    return { ...tools, ...foods };
  },
  foods: () => loadJson(() => import('../data/generated/foods.json')),
  qa: () => loadJson(() => import('../data/generated/qa.json')),
  anatomy: () => loadJson(() => import('../data/generated/anatomy.json')),
  source: () => loadJson(() => import('../data/generated/source.json')),
};

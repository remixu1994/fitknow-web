import * as React from 'react';
import { Empty, PanelTitle } from '../components/ui/course-primitives';
import { useAppData } from '../lib/app-data';
import { matches } from '../lib/search';
import type { RouteConfig } from '../types';
import { ModuleRail } from './shared';

export function FoodsCourseRoute({ query, routes }: { query: string; routes: RouteConfig[] }) {
  const data = useAppData();
  const [macro, setMacro] = React.useState('全部');
  const foods = (data.foods ?? []).filter((item) => (macro === '全部' || item.macroType === macro) && matches(item, query));

  return (
    <div className="course-layout">
      <section className="panel content-stack">
        <PanelTitle title="日常食物营养率" subtitle="按碳水、蛋白质、GI 和部位说明查食物，快速估算日常摄入。" />
        <div className="segmented compact">
          {['全部', '碳水', '蛋白质'].map((item) => <button key={item} className={macro === item ? 'selected' : ''} onClick={() => setMacro(item)}>{item}</button>)}
        </div>
        <div className="food-grid">
          {foods.map((food) => (
            <details className="food-card" key={food.id}>
              <summary><b>{food.name}</b><span>{food.group}</span><strong>{food.rate}</strong></summary>
              <p>{food.macroType} · {food.giOrPosition || '未标注'}</p>
              <p>{food.explanation || '暂无补充说明。'}</p>
            </details>
          ))}
        </div>
        {!foods.length && <Empty text="没有匹配的食物。" />}
      </section>
      <ModuleRail moduleId="foods" routes={routes} />
    </div>
  );
}

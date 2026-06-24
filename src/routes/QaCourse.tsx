import * as React from 'react';
import { PanelTitle } from '../components/ui/course-primitives';
import { useAppData } from '../lib/app-data';
import { matches } from '../lib/search';
import type { RouteConfig } from '../types';
import { ModuleRail, QaList } from './shared';

export function QaCourseRoute({ query, routes }: { query: string; routes: RouteConfig[] }) {
  const data = useAppData();
  const [category, setCategory] = React.useState('全部');
  const items = (data.qa ?? []).filter((item) => (category === '全部' || item.category === category) && matches(item, query));

  return (
    <div className="course-layout">
      <section className="panel content-stack">
        <PanelTitle title="减脂 / 增肌问答库" subtitle="整理常见执行问题，帮助你快速定位卡点。" />
        <div className="segmented compact">
          {['全部', '减脂', '增肌'].map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <QaList items={items} />
      </section>
      <ModuleRail moduleId="qa" routes={routes} />
    </div>
  );
}

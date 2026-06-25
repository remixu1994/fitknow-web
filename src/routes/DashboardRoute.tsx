import * as React from 'react';
import { Stat, PanelTitle } from '../components/ui/course-primitives';
import { useAppData } from '../lib/app-data';
import type { RouteConfig } from '../types';
import { ModuleRail, SearchResultList, useSearchResults } from './shared';
import { CardioCalculator, OneRepMaxCalculator } from './ToolsCourse';

export function DashboardRoute({ query, routes }: { query: string; routes: RouteConfig[] }) {
  const data = useAppData();
  const results = useSearchResults(query);
  const lessonCards = [
    { href: '#/fat-loss', title: '减脂饮食课', meta: '8 个时间方案', text: '先确定训练时间，再看力训日、休息日和调整规则。' },
    { href: '#/muscle-gain', title: '增肌饮食课', meta: '7 个时间方案', text: '围绕练前练后安排碳水和蛋白质，形成清晰的一日饮食结构。' },
    { href: '#/training', title: '训练计划课', meta: '4 套分化计划', text: '按健身房/居家、三分化/四分化和 Day 进入动作表。' },
    { href: '#/anatomy', title: '拉伸解剖课', meta: '35 张图示', text: '把肌肉、关节活动和拉伸图谱放到同一条学习路径里。' },
  ];

  return (
    <div className="course-layout gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="content-stack gap-5">
        <section className="hero-panel overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[linear-gradient(180deg,rgba(251,253,251,0.98)_0%,rgba(255,255,255,1)_100%)] p-6 shadow-sm sm:p-8">
          <div className="min-w-0">
            <p className="section-label">按目标学习</p>
            <h2>按目标学习饮食、训练和动作知识</h2>
            <p>把减脂、增肌、训练计划、食物营养和常见问题整理成可搜索的学习路径，方便按目标推进和反复查询。</p>
            <div className="quick-actions flex flex-wrap gap-3">
              <a href="#/fat-loss">开始减脂路径</a>
              <a href="#/training">选择训练计划</a>
              <a href="#/source">下载资料</a>
            </div>
          </div>
          <div className="metric-grid grid grid-cols-2 gap-3">
            <Stat value={data.counts?.dietPlans ?? '-'} label="饮食方案" />
            <Stat value={data.counts?.trainingPlans ?? '-'} label="训练计划" />
            <Stat value={data.counts?.foods ?? '-'} label="食物条目" />
            <Stat value={data.counts?.qa ?? '-'} label="问答条目" />
          </div>
        </section>

        {query.trim() && (
          <section className="panel rounded-3xl border border-[color:var(--line)] bg-[color:var(--paper)] p-6 shadow-sm">
            <PanelTitle title="全局搜索结果" subtitle={`关键词：${query}`} />
            <SearchResultList items={results} />
          </section>
        )}

        <section className="lesson-grid grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {lessonCards.map((card) => (
            <a className="lesson-card rounded-3xl border border-[color:var(--line)] bg-[color:var(--paper)] p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg" href={card.href} key={card.title}>
              <span>{card.meta}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </a>
          ))}
        </section>

        <section className="split-grid grid gap-4 xl:grid-cols-2">
          <CardioCalculator compact />
          <OneRepMaxCalculator compact />
        </section>
      </div>
      <ModuleRail moduleId="dashboard" routes={routes} />
    </div>
  );
}

import * as React from 'react';
import { Empty } from '../components/ui/course-primitives';
import { useAppData } from '../lib/app-data';
import { matches } from '../lib/search';
import type { QA, RouteConfig, RouteId, SearchResult } from '../types';

const moduleDetails: Record<RouteId, { label: string; description: string }> = {
  dashboard: { label: '总览', description: '从目标路径、工具和资料入口快速开始学习。' },
  'fat-loss': { label: '减脂饮食', description: '按训练时间拆解力训日、休息日和每日饮食安排。' },
  'muscle-gain': { label: '增肌饮食', description: '围绕练前练后安排碳水和蛋白质，稳定推进增肌。' },
  training: { label: '训练计划', description: '根据训练环境和分化方式选择适合自己的动作表。' },
  tools: { label: '热量工具', description: '估算有氧消耗和 1RM，辅助训练记录。' },
  foods: { label: '食物营养', description: '查询食物碳水、蛋白质和换算关系。' },
  qa: { label: '问答库', description: '集中查看减脂、增肌和训练常见问题。' },
  anatomy: { label: '拉伸解剖', description: '按关节活动、目标肌肉和图谱理解动作。' },
  source: { label: '资料下载', description: '查看生成数据来源，并下载原始 Excel 资料。' },
};

export function ModuleRail({ moduleId, routes }: { moduleId: RouteId; routes: RouteConfig[] }) {
  const module = moduleDetails[moduleId] || moduleDetails.dashboard;
  const relatedRoutes = routes.filter((route) => route.id !== moduleId).slice(0, 6);

  return (
    <aside className="module-rail rounded-3xl border border-[color:var(--line)] bg-[color:var(--rail)] p-5 shadow-sm xl:sticky xl:top-24">
      <p className="section-label">继续探索</p>
      <h2>{module.label}</h2>
      <p>{module.description}</p>
      <div className="source-list">
        {relatedRoutes.map((route) => (
          <a href={route.hash} key={route.id}>
            <span>{route.mark}</span>
            <b>{route.label}</b>
          </a>
        ))}
      </div>
    </aside>
  );
}

export function QaList({ items }: { items: QA[] }) {
  return (
    <div className="qa-list">
      {items.map((item, index) => {
        const answerSections = (item.answer || '\u6682\u65e0\u7b54\u6848').split(/\n{2,}/).map((section) => section.trim()).filter(Boolean);

        return (
          <details className="qa-item" key={`${item.id}-${index}`}>
            <summary><span>{item.category}</span><b>{item.question}</b></summary>
            <div className="qa-answer">
              {answerSections.map((section, sectionIndex) => <p key={sectionIndex}>{section}</p>)}
            </div>
          </details>
        );
      })}
      {!items.length && <Empty text="\u6ca1\u6709\u5339\u914d\u7684\u95ee\u7b54" />}
    </div>
  );
}

export function Table({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function SearchResultList({ items }: { items: SearchResult[] }) {
  if (!items.length) return <Empty text="没有找到匹配结果" />;
  return (
    <div className="result-list">
      {items.map((item, index) => (
        <a className="result-row" href={item.href} key={`${item.type}-${index}`}>
          <span>{item.type}</span>
          <b>{item.title}</b>
        </a>
      ))}
    </div>
  );
}

export function useSearchResults(query: string): SearchResult[] {
  const data = useAppData();

  return React.useMemo(() => {
    if (!query.trim()) return [];
    const search = data.dashboardSearch;
    if (!search) return [];

    const diet = search.dietPlans.filter((item) => matches(item, query)).slice(0, 5).map((item) => ({
      type: item.goal === 'fat-loss' ? '减脂饮食' : '增肌饮食',
      title: item.title,
      href: item.goal === 'fat-loss' ? '#/fat-loss' : '#/muscle-gain',
      sourceRefs: item.sourceRefs,
    }));
    const training = search.trainingPlans.flatMap((plan) => plan.days.map((day) => ({ plan, day })))
      .filter((item) => matches(item, query)).slice(0, 5).map((item) => ({
        type: '训练计划',
        title: `${item.plan.title} · ${item.day.title}`,
        href: '#/training',
        sourceRefs: item.plan.sourceRefs,
      }));
    const foods = search.foods.filter((item) => matches(item, query)).slice(0, 5).map((item) => ({
      type: '食物营养',
      title: `${item.name} · ${item.rate}`,
      href: '#/foods',
      sourceRefs: item.sourceRefs,
    }));
    const qa = search.qa.filter((item) => matches(item, query)).slice(0, 5).map((item) => ({
      type: `${item.category}问答`,
      title: item.question,
      href: '#/qa',
      sourceRefs: item.sourceRefs,
    }));

    return [...diet, ...training, ...foods, ...qa].slice(0, 14);
  }, [data.dashboardSearch, query]);
}

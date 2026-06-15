import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import data from './data/generated/workbook.json';
import './styles.css';
import ErrorBoundary from './components/ErrorBoundary';

const routes = [
  { id: 'dashboard', hash: '#/', label: '总览', mark: '01' },
  { id: 'fat-loss', hash: '#/fat-loss', label: '减脂饮食', mark: '02' },
  { id: 'muscle-gain', hash: '#/muscle-gain', label: '增肌饮食', mark: '03' },
  { id: 'training', hash: '#/training', label: '训练计划', mark: '04' },
  { id: 'tools', hash: '#/tools', label: '热量工具', mark: '05' },
  { id: 'foods', hash: '#/foods', label: '食物营养', mark: '06' },
  { id: 'qa', hash: '#/qa', label: '问答库', mark: '07' },
  { id: 'anatomy', hash: '#/anatomy', label: '拉伸解剖', mark: '08' },
  { id: 'source', hash: '#/source', label: '原表索引', mark: '09' },
];

// 好人松松 碳水/蛋白质/脂肪 比例表（g/kg体重）
// 格式：{weight: {height: [carbs, protein, fat]}}
const maleFatLossRatios = {
  60: {160: [2.6, 2.0, 1.4]},
  65: {160: [2.6, 1.9, 1.4], 165: [2.6, 2.0, 1.4]},
  70: {160: [2.5, 1.9, 1.3], 165: [2.5, 2.0, 1.4], 170: [2.6, 2.0, 1.4], 175: [2.7, 2.1, 1.4]},
  75: {160: [2.4, 1.9, 1.3], 165: [2.5, 1.9, 1.3], 170: [2.5, 2.0, 1.4], 175: [2.6, 2.1, 1.4], 180: [2.7, 2.1, 1.4]},
  80: {160: [2.4, 1.9, 1.3], 165: [2.4, 1.9, 1.3], 170: [2.5, 2.0, 1.3], 175: [2.5, 2.0, 1.4], 180: [2.6, 2.1, 1.4], 185: [2.6, 2.1, 1.4]},
  85: {160: [2.3, 1.8, 1.2], 165: [2.4, 1.9, 1.3], 170: [2.4, 1.9, 1.3], 175: [2.5, 2.0, 1.3], 180: [2.5, 2.0, 1.4], 185: [2.6, 2.1, 1.4], 190: [2.6, 2.2, 1.4]},
  90: {160: [2.3, 1.8, 1.2], 165: [2.3, 1.9, 1.2], 170: [2.4, 1.9, 1.3], 175: [2.4, 2.0, 1.3], 180: [2.5, 2.0, 1.3], 185: [2.5, 2.1, 1.4], 190: [2.6, 2.1, 1.4]},
  95: {160: [2.2, 1.8, 1.2], 165: [2.3, 1.8, 1.2], 170: [2.3, 1.9, 1.2], 175: [2.4, 1.9, 1.3], 180: [2.4, 2.0, 1.3], 185: [2.5, 2.0, 1.3], 190: [2.5, 2.1, 1.3]},
  100: {160: [2.2, 1.8, 1.2], 165: [2.2, 1.8, 1.2], 170: [2.3, 1.9, 1.2], 175: [2.3, 1.9, 1.2], 180: [2.4, 2.0, 1.3], 185: [2.4, 2.0, 1.3], 190: [2.5, 2.1, 1.3]},
  105: {160: [2.1, 1.8, 1.2], 165: [2.2, 1.8, 1.2], 170: [2.2, 1.9, 1.2], 175: [2.3, 1.9, 1.2], 180: [2.3, 1.9, 1.2], 185: [2.4, 2.0, 1.3], 190: [2.4, 2.0, 1.3]},
  110: {160: [2.1, 1.8, 1.1], 165: [2.2, 1.8, 1.2], 170: [2.2, 1.8, 1.2], 175: [2.2, 1.9, 1.2], 180: [2.3, 1.9, 1.2], 185: [2.3, 2.0, 1.3], 190: [2.4, 2.0, 1.3]},
  115: {160: [2.1, 1.7, 1.1], 165: [2.1, 1.8, 1.1], 170: [2.2, 1.8, 1.2], 175: [2.2, 1.9, 1.2], 180: [2.2, 1.9, 1.2], 185: [2.3, 1.9, 1.2], 190: [2.3, 2.0, 1.3]},
  120: {160: [1.9, 1.6, 1.0], 165: [2.0, 1.6, 1.1], 170: [2.0, 1.7, 1.1], 175: [2.1, 1.7, 1.1], 180: [2.1, 1.8, 1.1], 185: [2.1, 1.8, 1.1], 190: [2.2, 1.8, 1.2]},
  125: {160: [1.9, 1.6, 1.0], 165: [1.9, 1.6, 1.1], 170: [2.0, 1.7, 1.1], 175: [2.0, 1.7, 1.1], 180: [2.1, 1.7, 1.1], 185: [2.1, 1.8, 1.1], 190: [2.1, 1.8, 1.2]},
  130: {160: [1.9, 1.6, 1.0], 165: [1.9, 1.6, 1.0], 170: [2.0, 1.7, 1.1], 175: [2.0, 1.7, 1.1], 180: [2.0, 1.7, 1.1], 185: [2.1, 1.8, 1.1], 190: [2.1, 1.8, 1.1]},
};

const maleMuscleGainRatios = {
  50: {160: [4.0, 3.0, 1.7], 165: [4.1, 3.1, 1.8], 170: [4.3, 3.2, 1.8], 175: [4.4, 3.4, 1.9], 180: [4.5, 3.5, 1.9], 185: [4.7, 3.6, 2.0], 190: [4.8, 3.8, 2.1]},
  55: {160: [3.8, 2.9, 1.6], 165: [4.0, 3.0, 1.7], 170: [4.1, 3.1, 1.7], 175: [4.2, 3.2, 1.8], 180: [4.3, 3.4, 1.9], 185: [4.4, 3.5, 1.9], 190: [4.6, 3.6, 2.0]},
  60: {160: [3.7, 2.8, 1.6], 165: [3.8, 2.9, 1.6], 170: [3.9, 3.0, 1.7], 175: [4.0, 3.2, 1.7], 180: [4.1, 3.3, 1.8], 185: [4.2, 3.4, 1.8], 190: [4.4, 3.5, 1.9]},
  65: {160: [3.6, 2.8, 1.5], 165: [3.7, 2.9, 1.6], 170: [3.8, 3.0, 1.6], 175: [3.9, 3.1, 1.7], 180: [4.0, 3.2, 1.7], 185: [4.1, 3.3, 1.7], 190: [4.2, 3.4, 1.8]},
  70: {160: [3.5, 2.7, 1.5], 165: [3.6, 2.8, 1.5], 170: [3.7, 2.9, 1.6], 175: [3.8, 3.0, 1.6], 180: [3.8, 3.1, 1.6], 185: [3.9, 3.2, 1.7], 190: [4.0, 3.3, 1.8]},
  75: {160: [3.5, 2.7, 1.5], 165: [3.5, 2.7, 1.5], 170: [3.6, 2.8, 1.5], 175: [3.7, 2.9, 1.6], 180: [3.8, 3.0, 1.6], 185: [3.8, 3.1, 1.6], 190: [3.9, 3.2, 1.7]},
  80: {160: [3.4, 2.6, 1.4], 165: [3.5, 2.7, 1.5], 170: [3.5, 2.7, 1.5], 175: [3.6, 2.8, 1.5], 180: [3.7, 2.9, 1.6], 185: [3.7, 3.0, 1.6], 190: [3.8, 3.1, 1.6]},
  85: {160: [3.4, 2.6, 1.4], 165: [3.4, 2.6, 1.4], 170: [3.5, 2.7, 1.4], 175: [3.5, 2.7, 1.5], 180: [3.6, 2.8, 1.5], 185: [3.6, 2.9, 1.5], 190: [3.7, 3.0, 1.6]},
  90: {160: [3.3, 2.5, 1.4], 165: [3.3, 2.5, 1.4], 170: [3.4, 2.6, 1.4], 175: [3.4, 2.6, 1.4], 180: [3.5, 2.7, 1.5], 185: [3.5, 2.8, 1.5], 190: [3.6, 2.9, 1.5]},
  95: {160: [3.2, 2.5, 1.3], 165: [3.3, 2.5, 1.3], 170: [3.3, 2.5, 1.4], 175: [3.4, 2.6, 1.4], 180: [3.4, 2.7, 1.4], 185: [3.5, 2.7, 1.5], 190: [3.5, 2.8, 1.5]},
};

function lookupRatio(ratioTable, weight, height) {
  const weights = Object.keys(ratioTable).map(Number).sort((a, b) => a - b);
  let bestWeight = weights[0];
  for (const w of weights) {
    if (Math.abs(w - weight) < Math.abs(bestWeight - weight)) bestWeight = w;
  }
  const heights = Object.keys(ratioTable[bestWeight]).map(Number).sort((a, b) => a - b);
  let bestHeight = heights[0];
  for (const h of heights) {
    if (Math.abs(h - height) < Math.abs(bestHeight - height)) bestHeight = h;
  }
  return ratioTable[bestWeight][bestHeight];
}

const routeFromHash = () => (window.location.hash || '#/').replace('#/', '') || 'dashboard';

function NotFound() {
  return (
    <div className="not-found">
      <h2>404</h2>
      <p>页面不存在</p>
      <a href="#/">返回首页</a>
    </div>
  );
}

const asText = (value) => String(value ?? '');
const compact = (value, max = 128) => asText(value).replace(/\s+/g, ' ').slice(0, max);
const matches = (item, query) => !query || JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
const moduleById = Object.fromEntries((data.modules || []).map((item) => [item.id, item]));
const sheetByIndex = Object.fromEntries(data.sheets.map((sheet) => [sheet.index, sheet]));

function App() {
  const [route, setRoute] = useState(routeFromHash());
  const [query, setQuery] = useState('');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && setLightbox(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const active = routes.find((item) => item.id === route);

  if (!active) {
    return (
      <Shell active={routes[0]} query={query} setQuery={setQuery}>
        <NotFound />
      </Shell>
    );
  }

  return (
    <>
      <Shell active={active} query={query} setQuery={setQuery}>
        {active.id === 'dashboard' && <Dashboard query={query} />}
        {active.id === 'fat-loss' && <DietCourse goal="fat-loss" query={query} />}
        {active.id === 'muscle-gain' && <DietCourse goal="muscle-gain" query={query} />}
        {active.id === 'training' && <TrainingCourse query={query} />}
        {active.id === 'tools' && <ToolsCourse />}
        {active.id === 'foods' && <FoodsCourse query={query} />}
        {active.id === 'qa' && <QaCourse query={query} />}
        {active.id === 'anatomy' && <AnatomyCourse query={query} openLightbox={setLightbox} />}
        {active.id === 'source' && <SourceIndex query={query} />}
      </Shell>
      {lightbox && <Lightbox image={lightbox} close={() => setLightbox(null)} />}
    </>
  );
}

function Shell({ active, query, setQuery, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#/">
          <span className="brand-mark">FK</span>
          <span>
            <strong>FitKnow</strong>
            <em>健身知识课</em>
          </span>
        </a>
        <nav className="nav-list" aria-label="主导航">
          {routes.map((item) => (
            <a key={item.id} className={item.id === active.id ? 'active' : ''} href={item.hash}>
              <span>{item.mark}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <SourceSummary />
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="kicker">来自 Sheet 1-29 · 原文保留 · 按目标学习</p>
            <h1>{active.label}</h1>
          </div>
          <label className="search">
            <span>搜索动作 / 食物 / 问题</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="高位下拉 / 鸡胸肉 / 减脂不掉秤" />
          </label>
        </header>
        <main key={active.id} className="page-enter">{children}</main>
      </div>
    </div>
  );
}

function SourceSummary() {
  return (
    <div className="source-box">
      <b>数据源</b>
      <span>{data.source}</span>
      <small>{data.sheets.length} 张表 · {new Date(data.generatedAt).toLocaleString('zh-CN')}</small>
    </div>
  );
}

function Dashboard({ query }) {
  const results = useSearchResults(query);
  const lessonCards = [
    { href: '#/fat-loss', title: '减脂饮食课', meta: '8 个时间方案', text: '先确定训练时间，再看力训日、休息日和调整规则。' },
    { href: '#/muscle-gain', title: '增肌饮食课', meta: '7 个时间方案', text: '围绕练前练后安排碳水和蛋白质，保留原表细节。' },
    { href: '#/training', title: '训练计划课', meta: '4 套分化计划', text: '按健身房/居家、三分化/四分化和 Day 进入动作表。' },
    { href: '#/anatomy', title: '拉伸解剖课', meta: '35 张图示', text: '把肌肉、关节活动和拉伸图谱放到同一条学习路径里。' },
  ];

  return (
    <div className="course-layout">
      <div className="content-stack">
        <section className="hero-panel">
          <div>
            <p className="section-label">按目标学习</p>
            <h2>把健身 Excel 变成可学习、可搜索、可追溯的课程工作台</h2>
            <p>每个模块都从原始 sheet 抽取结构化内容，同时保留原表行号，适合新手按目标推进，也适合反复查询动作、食物和问题。</p>
            <div className="quick-actions">
              <a href="#/fat-loss">开始减脂路径</a>
              <a href="#/training">选择训练计划</a>
              <a href="#/source">查看原表索引</a>
            </div>
          </div>
          <div className="metric-grid">
            <Stat value={data.dietPlans.length} label="饮食方案" />
            <Stat value={data.trainingPlans.length} label="训练计划" />
            <Stat value={data.foods.length} label="食物条目" />
            <Stat value={data.qa.length} label="问答条目" />
          </div>
        </section>

        {query.trim() && (
          <section className="panel">
            <PanelTitle title="全局搜索结果" subtitle={`关键词：${query}`} />
            <ResultList items={results} />
          </section>
        )}

        <section className="lesson-grid">
          {lessonCards.map((card) => (
            <a className="lesson-card" href={card.href} key={card.title}>
              <span>{card.meta}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </a>
          ))}
        </section>

        <section className="split-grid">
          <CardioCalculator compact />
          <OneRepMaxCalculator compact />
        </section>
      </div>
      <ModuleRail moduleId="dashboard" />
    </div>
  );
}

function useSearchResults(query) {
  return useMemo(() => {
    if (!query.trim()) return [];
    const diet = data.dietPlans.filter((item) => matches(item, query)).slice(0, 5).map((item) => ({
      type: item.goal === 'fat-loss' ? '减脂饮食' : '增肌饮食',
      title: item.title,
      href: item.goal === 'fat-loss' ? '#/fat-loss' : '#/muscle-gain',
      sourceRefs: item.sourceRefs,
    }));
    const training = data.trainingPlans.flatMap((plan) => plan.days.map((day) => ({ plan, day })))
      .filter((item) => matches(item, query)).slice(0, 5).map((item) => ({
        type: '训练计划',
        title: `${item.plan.title} · ${item.day.title}`,
        href: '#/training',
        sourceRefs: item.plan.sourceRefs,
      }));
    const foods = data.foods.filter((item) => matches(item, query)).slice(0, 5).map((item) => ({
      type: '食物营养',
      title: `${item.name} · ${item.rate}`,
      href: '#/foods',
      sourceRefs: item.sourceRefs,
    }));
    const qa = data.qa.filter((item) => matches(item, query)).slice(0, 5).map((item) => ({
      type: `${item.category}问答`,
      title: item.question,
      href: '#/qa',
      sourceRefs: item.sourceRefs,
    }));
    return [...diet, ...training, ...foods, ...qa].slice(0, 14);
  }, [query]);
}

function ResultList({ items }) {
  if (!items.length) return <Empty text="没有找到匹配内容。" />;
  return (
    <div className="result-list">
      {items.map((item, index) => (
        <a className="result-row" href={item.href} key={`${item.type}-${index}`}>
          <span>{item.type}</span>
          <b>{item.title}</b>
          <small>{formatSources(item.sourceRefs)}</small>
        </a>
      ))}
    </div>
  );
}

function DietCourse({ goal, query }) {
  const plans = data.dietPlans.filter((plan) => plan.goal === goal);
  const [selectedId, setSelectedId] = useState(plans[0]?.id);
  const selected = plans.find((plan) => plan.id === selectedId) || plans[0];
  const category = goal === 'fat-loss' ? '减脂' : '增肌';
  const relatedQa = data.qa.filter((item) => item.category === category && matches(item, query)).slice(0, 8);
  const filterRows = (rows) => rows.filter((row) => matches(row, query)).slice(0, 60);

  return (
    <div className="course-layout">
      <div className="content-stack">
        {selected && (
          <section className="panel">
            <GoalInputPlanner
              goal={goal}
              plan={selected}
              query={query}
              pathSelector={(
                <div className="path-selector-inline">
                  <PanelTitle title={`${category}饮食路径`} subtitle="选择训练发生的时间，下面会切换对应的力训日、休息日或每日饮食表。" />
                  <Segmented items={plans} selectedId={selected?.id} onSelect={setSelectedId} getLabel={(item) => item.timing} />
                </div>
              )}
            />
            <PanelTitle title="原表输入说明" subtitle="下面保留 Excel 中对输入项、调整规则和执行注意事项的原始说明。" />
            <div className="info-grid">
              {selected.inputs.map((item, index) => (
                <article className="info-tile" key={`${item.label}-${index}`}>
                  <b>{item.label}</b>
                  <span>{item.detail}</span>
                </article>
              ))}
            </div>
            {selected.mealTables?.length ? null : (
              <div className="split-grid">
                <MealList title="力训日饮食" rows={filterRows(selected.trainingDayMeals)} />
                <MealList title="休息日饮食" rows={filterRows(selected.restDayMeals)} />
              </div>
            )}
            <details className="source-details">
              <summary>查看原表行</summary>
              <RawRows rows={selected.rawRows} />
            </details>
          </section>
        )}
        <section className="panel">
          <PanelTitle title={`${category}常见问题`} subtitle="把执行中最容易卡住的问题放在饮食路径旁边。" />
          <QaList items={relatedQa} />
        </section>
      </div>
      <ModuleRail moduleId={goal} activeRefs={selected?.sourceRefs} />
    </div>
  );
}

const fatLossQuotaTables = {
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

const defaultProfiles = {
  'fat-loss': { sex: 'male', height: '175', weight: '75', age: '28', strengthCalories: '200', cardioCalories: '0' },
  'muscle-gain': { sex: 'male', height: '175', weight: '65', age: '28', strengthCalories: '200', cardioCalories: '0' },
};

function GoalInputPlanner({ goal, plan, query = '', pathSelector = null }) {
  const storageKey = `fitknow-${goal}-profile`;
  const [profile, setProfile] = useState(() => {
    try {
      return { ...defaultProfiles[goal], ...JSON.parse(localStorage.getItem(storageKey) || '{}') };
    } catch {
      return defaultProfiles[goal];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(profile));
  }, [profile, storageKey]);

  const update = (field) => (event) => setProfile((current) => ({ ...current, [field]: event.target.value }));
  const metrics = useMemo(() => computeNutrition(goal, profile, plan), [goal, profile, plan]);
  const isFatLoss = goal === 'fat-loss';
  const isNoStrength = isFatLoss && isNoStrengthPlan(plan);
  const category = isFatLoss ? '减脂' : '增肌';

  return (
    <div className="planner-panel">
      <div className="planner-head">
        <div>
          <p className="section-label">自己输入</p>
          <h3>{category}目标计算器</h3>
          <p>{isFatLoss ? '按 Excel 口径估算无运动总消耗、力训/休息日平衡热量和应吃热量，再结合配额表拆到每餐。' : '按 Excel 口径估算无运动总消耗、力训/休息日平衡热量和应吃热量，再结合增肌配额拆到每餐。'}</p>
        </div>
        <SourcePills refs={plan.sourceRefs} />
      </div>

      <div className="profile-form">
        <Field label="性别">
          <select value={profile.sex} onChange={update('sex')}>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </Field>
        <Field label="身高 cm"><input inputMode="decimal" value={profile.height} onChange={update('height')} /></Field>
        <Field label="体重 kg"><input inputMode="decimal" value={profile.weight} onChange={update('weight')} /></Field>
        <Field label="年龄"><input inputMode="numeric" value={profile.age} onChange={update('age')} /></Field>
        {!isNoStrength && <Field label="力训消耗 kcal/天"><input inputMode="decimal" value={profile.strengthCalories ?? ''} onChange={update('strengthCalories')} /></Field>}
        <Field label="有氧消耗 kcal/天"><input inputMode="decimal" value={profile.cardioCalories ?? ''} onChange={update('cardioCalories')} /></Field>
      </div>

      <div className="metric-strip">
        <Stat value={metrics.bmiText} label={`BMI · ${metrics.bmiLabel}`} />
        <Stat value={`${metrics.bmr} kcal`} label="基础代谢估算" />
        <Stat value={`${metrics.restingExpenditure} kcal`} label="无运动总消耗 b=a÷0.7" />
        <Stat value={`${metrics.primaryTargetCalories} kcal`} label={isNoStrength ? '每日应吃热量' : '力训日应吃热量'} />
      </div>

      <DietSummary metrics={metrics} plan={plan} />

      <div className="advice-box">
        <b>{category}建议</b>
        <p>{metrics.advice}</p>
        <p>{metrics.targetWeightText}</p>
      </div>

      {pathSelector}
      <StructuredMealTables plan={plan} metrics={metrics} query={query} />
    </div>
  );
}

function computeNutrition(goal, profile, plan) {
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

  // 使用好人松松比例表查表（仅男性适用，女性回退到旧公式）
  let carbsRate, proteinRate, fatRate;
  if (sex === 'male') {
    const table = goal === 'fat-loss' ? maleFatLossRatios : maleMuscleGainRatios;
    const ratios = lookupRatio(table, weight, height);
    [carbsRate, proteinRate, fatRate] = ratios;
  } else {
    carbsRate = 0; // 女性暂用旧公式计算
    proteinRate = goal === 'fat-loss' ? 1.8 : 1.7;
    fatRate = goal === 'fat-loss' ? 0.75 : 0.9;
  }

  let trainingCarbs, trainingProtein, trainingFat, restCarbs, restProtein, restFat;

  if (sex === 'male' && carbsRate > 0) {
    // 力训日：比例 * 体重
    trainingCarbs = Math.round(weight * carbsRate);
    trainingProtein = Math.round(weight * proteinRate);
    trainingFat = Math.round(weight * fatRate);
    // 休息日：碳水 * 0.82，蛋白质和脂肪不变
    restCarbs = Math.round(trainingCarbs * 0.82);
    restProtein = trainingProtein;
    restFat = trainingFat;
  } else {
    // 女性回退：用旧公式
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

  // 兼容旧字段：用力训日数据
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
    protein,
    fat,
    carbs,
    carbsRate: Math.round(carbsRate * 100) / 100,
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

function clampNumber(value, min, max, fallback) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function isNoStrengthPlan(plan) {
  return plan?.title?.includes('无力训者');
}

function roundedKey(value) {
  return String(Math.round(Number(value) || 0));
}

function findFatLossQuota(sex, height, weight, noStrength) {
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
  return { ...entry, key: match.key, sex, noStrength, matchedHeight: match.height, matchedWeight: match.weight, isExact: exact != null };
}

function dayLabel(dayType) {
  if (dayType === 'training') return '力训日';
  if (dayType === 'rest') return '休息日';
  return '每日';
}

function computeMealTargets(metrics, table, meal) {
  const quota = metrics.quotaMatch;
  const carbTotal = quota
    ? (table.dayType === 'training' ? quota.trainingCarb : table.dayType === 'rest' ? quota.restCarb : quota.dailyCarb) * metrics.weight
    : table.dayType === 'rest'
      ? metrics.restCarbs
      : metrics.trainingCarbs;
  const proteinTotal = quota ? quota.protein * metrics.weight : table.dayType === 'rest' ? metrics.restProtein : metrics.trainingProtein;
  if (!Number.isFinite(carbTotal) || !Number.isFinite(proteinTotal)) return null;
  return {
    carbTotal,
    proteinTotal,
    carb: carbTotal * meal.carbPercent / 100,
    protein: proteinTotal * meal.proteinPercent / 100,
  };
}

function targetCaloriesForTable(metrics, dayType) {
  if (dayType === 'training') return metrics.trainingTargetCalories;
  if (dayType === 'rest') return metrics.restTargetCalories;
  return metrics.targetCalories;
}

function convertFoodWeight(targetGrams, food) {
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

function parseFoodRate(food) {
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

function computeFoodMacro(amount, food) {
  const value = Number.parseFloat(amount);
  const parsed = parseFoodRate(food);
  if (!Number.isFinite(value) || value <= 0 || !parsed) return 0;
  return value * parsed.rate;
}

function foodInputUnit(food) {
  return parseFoodRate(food)?.unit || 'g';
}

function suggestedFoodAmount(target, food) {
  const amount = convertFoodWeight(target, food);
  return amount ? String(amount.value) : '';
}

function suggestedMacroAmount(amount, food) {
  const macro = computeFoodMacro(amount, food);
  if (!macro) return '';
  return macro < 10 ? String(Math.round(macro * 10) / 10) : String(Math.round(macro));
}

function reverseFoodAmount(macro, food) {
  const value = Number.parseFloat(macro);
  const amount = convertFoodWeight(value, food);
  return amount ? String(amount.value) : '';
}

function foodOptionLabel(food) {
  return `${food.name} · ${food.rate}`;
}

function findFoodByQuery(query, foods, fuzzy = false) {
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

function foodMatchesOption(food, option) {
  const text = `${option || ''}`.replace(/\s+/g, '');
  const name = `${food.name}`.replace(/\s+/g, '');
  return text && (text.includes(name) || name.includes(text.slice(0, Math.min(4, text.length))));
}

function findDefaultFood(options = [], macroType, foods = data.foods) {
  const macroFoods = foods.filter((food) => food.macroType === macroType);
  const optionMatch = macroFoods.find((food) => options.some((option) => foodMatchesOption(food, option)));
  if (optionMatch) return optionMatch;
  const fallbackNames = macroType === '碳水'
    ? ['米饭（很软）', '米饭（一般）']
    : ['鸡蛋', '鸡胸肉', '瘦猪肉', '瘦牛肉'];
  return macroFoods.find((food) => fallbackNames.some((name) => food.name.includes(name))) || macroFoods[0];
}

function DietSummary({ metrics, plan }) {
  const isFatLoss = metrics.goal === 'fat-loss';
  const noStrength = isNoStrengthPlan(plan);
  const quota = metrics.quotaMatch || {
    trainingCarb: metrics.carbsRate,
    restCarb: Math.round((metrics.restCarbs / metrics.weight) * 100) / 100,
    protein: metrics.proteinRate,
  };
  const calorieFactorText = isFatLoss ? '0.64' : '0.84';
  const quotaTitle = isFatLoss ? '配额查表' : '配额换算';
  return (
    <>
      <div className="macro-grid fatloss-metrics">
        {noStrength ? (
          <>
            <article>
              <b>每日平衡热量</b>
              <strong>{metrics.maintenanceCalories} kcal</strong>
              <span>d = b + 有氧消耗</span>
            </article>
            <article>
              <b>每日应吃热量</b>
              <strong>{metrics.targetCalories} kcal</strong>
              <span>平衡热量 × {calorieFactorText}</span>
            </article>
          </>
        ) : (
          <>
            <article>
              <b>力训日平衡热量</b>
              <strong>{metrics.trainingMaintenanceCalories} kcal</strong>
              <span>e1 = 无运动总消耗 + 力训消耗 + 有氧消耗</span>
            </article>
            <article>
              <b>休息日平衡热量</b>
              <strong>{metrics.restMaintenanceCalories} kcal</strong>
              <span>e2 = 无运动总消耗 + 有氧消耗</span>
            </article>
            <article>
              <b>力训日应吃热量</b>
              <strong>{metrics.trainingTargetCalories} kcal</strong>
              <span>力训日平衡热量 × {calorieFactorText}</span>
            </article>
            <article>
              <b>休息日应吃热量</b>
              <strong>{metrics.restTargetCalories} kcal</strong>
              <span>休息日平衡热量 × {calorieFactorText}</span>
            </article>
          </>
        )}
      </div>
      <div className="quota-box">
        <div>
          <p className="section-label">{quotaTitle}</p>
          <h3>{quota ? `${metrics.height}cm / ${metrics.weight}kg` : '暂无匹配配额'}</h3>
          <p>{quota ? (isFatLoss ? `配额单位为 g/kg 体重，采用 ${quota.matchedHeight}cm / ${quota.matchedWeight}kg 档${quota.isExact ? '' : '（体重按不超过输入值的最近档位取值）'}，下面按当前体重换算每日目标克数。` : `配额单位为 g/kg 体重，训练日碳水、休息日碳水和每日蛋白质按当前输入换算，下面会继续拆到每一餐。`) : '当前身高没有录入配额档位，饮食表仍可查看，但克数和食物重量暂不计算。'}</p>
        </div>
        {quota && (
          <div className="quota-grid">
            {noStrength ? (
              <>
                <Stat value={`${quota.dailyCarb} g/kg`} label={`每日碳水 · ${Math.round(quota.dailyCarb * metrics.weight)} g`} />
                <Stat value={`${quota.protein} g/kg`} label={`每日蛋白质 · ${Math.round(quota.protein * metrics.weight)} g`} />
              </>
            ) : (
              <>
                <Stat value={`${quota.trainingCarb} g/kg`} label={`训练日碳水 · ${Math.round(quota.trainingCarb * metrics.weight)} g`} />
                <Stat value={`${quota.restCarb} g/kg`} label={`休息日碳水 · ${Math.round(quota.restCarb * metrics.weight)} g`} />
                <Stat value={`${quota.protein} g/kg`} label={`每日蛋白质 · ${Math.round(quota.protein * metrics.weight)} g`} />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function StructuredMealTables({ plan, metrics, query }) {
  const tables = plan.mealTables || [];
  if (!tables.length) return null;
  return (
    <div className="structured-meals">
      {tables.map((table) => {
        const visibleMeals = table.meals.filter((meal) => matches({ table: table.title, meal }, query));
        if (!visibleMeals.length) return null;
        const firstTargets = visibleMeals.length ? computeMealTargets(metrics, table, visibleMeals[0]) : null;
        const calorie = targetCaloriesForTable(metrics, table.dayType);
        const guidance = collectMealGuidance(visibleMeals);
        return (
          <section className="meal-table-panel" key={table.dayType}>
            <div className="meal-table-head">
              <div>
                <p className="section-label">{dayLabel(table.dayType)}饮食</p>
                <h3>{table.title}</h3>
                <p>按全天配额拆分到每餐，再用食物营养率换算应吃重量。</p>
              </div>
              <div className="meal-table-totals">
                <Stat value={calorie ? `${calorie} kcal` : '-'} label="应吃热量" />
                <Stat value={firstTargets ? `${Math.round(firstTargets.carbTotal)} g` : '-'} label="全天碳水" />
                <Stat value={firstTargets ? `${Math.round(firstTargets.proteinTotal)} g` : '-'} label="全天蛋白质" />
              </div>
            </div>
            <div className="meal-card-grid">
              {visibleMeals.map((meal) => <MealCard key={`${table.dayType}-${meal.name}`} table={table} meal={meal} metrics={metrics} />)}
            </div>
            <MealGuidance guidance={guidance} />
          </section>
        );
      })}
    </div>
  );
}

function MealCard({ table, meal, metrics }) {
  const targets = computeMealTargets(metrics, table, meal);
  return (
    <article className="meal-card">
      <div className="meal-card-title">
        <span>{meal.order}</span>
        <div>
          <h4>{meal.name.replace(/^[①②③④⑤]/, '')}</h4>
          <p>{meal.mealTypeLabel} · 碳水 {meal.carbPercent}% · 蛋白质 {meal.proteinPercent}%</p>
        </div>
      </div>
      <div className="meal-macro-columns">
        <MealFoodCell macroType="碳水" target={targets?.carb} options={meal.carbOptions} />
        <MealFoodCell macroType="蛋白质" target={targets?.protein} options={meal.proteinOptions} disabled={meal.proteinPercent === 0} />
      </div>
    </article>
  );
}

function collectMealGuidance(meals) {
  const unique = (items) => [...new Set(items.map((item) => (item || '').trim()).filter(Boolean))];
  return {
    fat: unique(meals.map((meal) => meal.fatNote)),
    produce: unique(meals.map((meal) => meal.produceNote)),
  };
}

function MealGuidance({ guidance }) {
  if (!guidance.fat.length && !guidance.produce.length) return null;
  return (
    <div className="meal-guidance">
      {guidance.fat.length > 0 && (
        <article>
          <b>脂肪吃法</b>
          {guidance.fat.map((text) => <p key={text}>{text}</p>)}
        </article>
      )}
      {guidance.produce.length > 0 && (
        <article>
          <b>蔬菜/水果</b>
          {guidance.produce.map((text) => <p key={text}>{text}</p>)}
        </article>
      )}
    </div>
  );
}

function MealFoodCell({ macroType, target, options, disabled = false }) {
  const foods = useMemo(() => data.foods.filter((food) => food.macroType === macroType), [macroType]);
  const defaultFood = useMemo(() => findDefaultFood(options, macroType, foods), [options, macroType, foods]);
  const listId = useMemo(() => `foods-${macroType}-${Math.random().toString(36).slice(2)}`, [macroType]);
  const makeEntry = (food = defaultFood || foods[0], amount = suggestedFoodAmount(target, food), macro = Number.isFinite(target) ? String(Math.round(target)) : suggestedMacroAmount(amount, food)) => ({
    id: `${Date.now()}-${Math.random()}`,
    foodId: food?.id || foods[0]?.id || '',
    foodQuery: food ? foodOptionLabel(food) : '',
    amount,
    macro,
  });
  const makeBlankEntry = () => ({
    id: `${Date.now()}-${Math.random()}`,
    foodId: '',
    foodQuery: '',
    amount: '',
    macro: '',
  });
  const [entries, setEntries] = useState(() => [makeEntry()]);

  useEffect(() => {
    setEntries([makeEntry()]);
  }, [defaultFood?.id, target, foods]);

  const updateEntry = (id, patch) => {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };
  const addEntry = () => setEntries((current) => [...current, makeBlankEntry()]);
  const removeEntry = (id) => setEntries((current) => current.length > 1 ? current.filter((entry) => entry.id !== id) : current);
  const applyFoodQuery = (entry, query, fuzzy = false) => {
    const nextFood = findFoodByQuery(query, foods, fuzzy);
    if (!nextFood) {
      updateEntry(entry.id, { foodId: '', foodQuery: query, macro: '' });
      return;
    }
    const macroValue = Number.parseFloat(entry.macro);
    const amount = Number.isFinite(macroValue) && macroValue > 0
      ? reverseFoodAmount(entry.macro, nextFood)
      : entry.amount;
    updateEntry(entry.id, {
      foodId: nextFood.id,
      foodQuery: foodOptionLabel(nextFood),
      amount,
      macro: suggestedMacroAmount(amount, nextFood),
    });
  };
  const applyAmount = (entry, value, food) => {
    updateEntry(entry.id, { amount: value, macro: suggestedMacroAmount(value, food) });
  };
  const applyMacro = (entry, value, food) => {
    updateEntry(entry.id, { macro: value, amount: reverseFoodAmount(value, food) });
  };
  const actualTotal = entries.reduce((sum, entry) => {
    const food = foods.find((item) => item.id === entry.foodId);
    return sum + computeFoodMacro(entry.amount, food);
  }, 0);
  const hasTarget = Number.isFinite(target);
  const gap = hasTarget ? target - actualTotal : null;
  const gapText = !hasTarget
    ? '暂无配额'
    : Math.abs(gap) < 0.5
      ? '已达标'
      : gap > 0
        ? `还差 ${Math.round(gap)} g`
        : `超出 ${Math.round(Math.abs(gap))} g`;
  return (
    <div className="meal-food-cell">
      <b>{macroType}{!disabled && hasTarget ? ` · 目标 ${Math.round(target)} g` : ''}</b>
      <strong>{disabled ? '不用吃' : hasTarget ? `${Math.round(actualTotal)} g` : '暂无配额'}</strong>
      {!disabled && (
        <>
          <span className={gap && gap < -0.5 ? 'macro-gap over' : 'macro-gap'}>{gapText}</span>
          <datalist id={listId}>
            {foods.map((item) => <option value={foodOptionLabel(item)} key={item.id} />)}
          </datalist>
          <div className="food-splitter">
            {entries.map((entry) => {
              const food = foods.find((item) => item.id === entry.foodId);
              const actual = computeFoodMacro(entry.amount, food);
              return (
                <div className="food-entry" key={entry.id}>
                  <input
                    className="food-search-input"
                    list={listId}
                    value={entry.foodQuery}
                    onChange={(event) => applyFoodQuery(entry, event.target.value)}
                    onBlur={(event) => applyFoodQuery(entry, event.target.value, true)}
                    placeholder="搜索食物"
                  />
                  <label className="food-entry-field">
                    <span>食物重量</span>
                    <input inputMode="decimal" value={entry.amount} onChange={(event) => applyAmount(entry, event.target.value, food)} placeholder="吃多少" />
                    <i>{food ? foodInputUnit(food) : '-'}</i>
                  </label>
                  <label className="food-entry-field">
                    <span>实际{macroType}</span>
                    <input inputMode="decimal" value={entry.macro} onChange={(event) => applyMacro(entry, event.target.value, food)} placeholder={macroType} />
                    <i>g</i>
                  </label>
                  <em>{Math.round(actual)} g</em>
                  <button type="button" onClick={() => removeEntry(entry.id)} aria-label="移除食物">×</button>
                </div>
              );
            })}
          </div>
          <button className="food-add" type="button" onClick={addEntry}>添加食物</button>
        </>
      )}
      {options?.length > 0 && <small>{options.slice(0, 2).join('；')}</small>}
    </div>
  );
}

function TrainingCourse({ query }) {
  const [planId, setPlanId] = useState(data.trainingPlans[0]?.id);
  const [dayFilter, setDayFilter] = useState('全部');
  const plan = data.trainingPlans.find((item) => item.id === planId) || data.trainingPlans[0];
  const dayOptions = ['全部', ...plan.days.map((day) => day.title)];
  const days = plan.days
    .filter((day) => dayFilter === '全部' || day.title === dayFilter)
    .map((day) => ({ ...day, rows: day.rows.filter((row) => matches(row, query)) }))
    .filter((day) => !query || matches(day, query) || day.rows.length);

  return (
    <div className="course-layout">
      <div className="content-stack">
        <section className="panel">
          <PanelTitle title="分化训练课程" subtitle="按场景和分化方式选择计划，再进入每一天的部位、组数、动作和关节提示。" />
          <Segmented items={data.trainingPlans} selectedId={plan.id} onSelect={setPlanId} getLabel={(item) => item.title} />
          <div className="segmented compact">
            {dayOptions.map((item) => <button key={item} className={item === dayFilter ? 'selected' : ''} onClick={() => setDayFilter(item)}>{item}</button>)}
          </div>
        </section>
        <section className="panel">
          <PanelTitle title={plan.title} subtitle={`${plan.environment === 'home' ? '居家' : '健身房'} · ${plan.splitType}`} />
          <SourcePills refs={plan.sourceRefs} />
          <div className="info-grid">
            {plan.info.slice(0, 8).map((item) => <article className="info-tile" key={item.label}><b>{item.label}</b><span>{compact(item.detail, 150)}</span></article>)}
          </div>
          {days.map((day) => (
            <details className="lesson-block" key={day.title} open>
              <summary>{day.title}</summary>
              {day.rationale && <p className="note">{day.rationale}</p>}
              <Table headers={['部位', '组数', '动作', '肩关节', '肘关节', '来源']} rows={day.rows.map((row) => [row.muscleGroup, row.setGuidance, row.exercise, row.shoulderJoint, row.elbowJoint, formatSources(row.sourceRefs)])} />
            </details>
          ))}
          {!days.length && <Empty text="没有匹配的训练内容。" />}
        </section>
      </div>
      <ModuleRail moduleId="training" activeRefs={plan.sourceRefs} />
    </div>
  );
}

function ToolsCourse() {
  return (
    <div className="course-layout">
      <div className="content-stack">
        <section className="split-grid">
          <CardioCalculator />
          <OneRepMaxCalculator />
        </section>
        <section className="panel">
          <PanelTitle title="食物重量换算" subtitle="目标营养克数除以营养率，快速估算需要吃多少克食物。" />
          <FoodCalculator />
        </section>
      </div>
      <ModuleRail moduleId="tools" />
    </div>
  );
}

function FoodsCourse({ query }) {
  const [macro, setMacro] = useState('全部');
  const foods = data.foods.filter((item) => (macro === '全部' || item.macroType === macro) && matches(item, query));
  return (
    <div className="course-layout">
      <section className="panel content-stack">
        <PanelTitle title="日常食物营养率" subtitle="按碳水、蛋白质、GI/部位说明查食物，详情里保留原表解释。" />
        <div className="segmented compact">
          {['全部', '碳水', '蛋白质'].map((item) => <button key={item} className={macro === item ? 'selected' : ''} onClick={() => setMacro(item)}>{item}</button>)}
        </div>
        <div className="food-grid">
          {foods.map((food) => (
            <details className="food-card" key={food.id}>
              <summary><b>{food.name}</b><span>{food.group}</span><strong>{food.rate}</strong></summary>
              <p>{food.macroType} · {food.giOrPosition || '未标注'}</p>
              <p>{food.explanation || '原表无额外说明。'}</p>
              <SourcePills refs={food.sourceRefs} />
            </details>
          ))}
        </div>
        {!foods.length && <Empty text="没有匹配的食物。" />}
      </section>
      <ModuleRail moduleId="foods" />
    </div>
  );
}

function QaCourse({ query }) {
  const [category, setCategory] = useState('全部');
  const items = data.qa.filter((item) => (category === '全部' || item.category === category) && matches(item, query));
  return (
    <div className="course-layout">
      <section className="panel content-stack">
        <PanelTitle title="减脂 / 增肌问答库" subtitle="按问题定位执行中的卡点，答案保留原表正文和来源行。" />
        <div className="segmented compact">
          {['全部', '减脂', '增肌'].map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <QaList items={items} />
      </section>
      <ModuleRail moduleId="qa" />
    </div>
  );
}

function AnatomyCourse({ query, openLightbox }) {
  const anatomy = data.anatomy;
  const jointRows = anatomy.jointToMuscles.filter((item) => matches(item, query));
  const galleries = anatomy.imageGalleries
    .map((gallery) => ({ ...gallery, images: gallery.images.filter((image) => matches({ gallery: gallery.title, image }, query)) }))
    .filter((gallery) => !query || matches(gallery, query) || gallery.images.length);

  return (
    <div className="course-layout">
      <div className="content-stack">
        <section className="panel">
          <PanelTitle title="健身解剖文字版" subtitle="先看关节活动和参与肌肉，再结合图示理解训练动作。" />
          <div className="info-grid">
            {anatomy.intro.map((item) => <article className="info-tile" key={item.title}><b>{item.title}</b><span>{item.body}</span></article>)}
          </div>
          <Table headers={['关节', '活动', '通俗描述', '动作例', '参与肌肉', '来源']} rows={jointRows.map((row) => [row.joint, row.movement, row.description, row.example, row.muscles.join('、'), formatSources(row.sourceRefs)])} />
          {anatomy.muscleSections.map((section) => (
            <details className="lesson-block" key={section.title}>
              <summary>{section.title}</summary>
              <Table headers={['关节', '活动', '通俗描述', '肌肉 / 动作', '来源']} rows={section.rows.filter((row) => matches(row, query)).map((row) => [row.joint, row.movement, row.description, row.targets.map((target) => `${target.muscle}: ${target.item}`).join('；'), formatSources(row.sourceRefs)])} />
            </details>
          ))}
        </section>
        {galleries.map((gallery) => (
          <section className="panel" key={gallery.id}>
            <PanelTitle title={gallery.title} subtitle={compact(gallery.note, 180)} />
            <div className="image-grid">
              {gallery.images.map((image) => (
                <figure className="image-card" key={image.src}>
                  <button onClick={() => openLightbox({ ...image, title: gallery.title })}><img src={image.src} alt={`${gallery.title} ${image.label}`} loading="lazy" /></button>
                  <figcaption>{image.label} · {image.anchor}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
      <ModuleRail moduleId="anatomy" />
    </div>
  );
}

function SourceIndex({ query }) {
  const [moduleId, setModuleId] = useState('全部');
  const modules = ['全部', ...routes.filter((route) => route.id !== 'dashboard').map((route) => route.id)];
  const sheets = data.sheetCategories.filter((sheet) => (moduleId === '全部' || sheet.moduleId === moduleId) && matches(sheet, query));
  const [openIndex, setOpenIndex] = useState(null);
  const openSheet = data.rawSheets.find((sheet) => sheet.index === openIndex);

  return (
    <div className="course-layout">
      <div className="content-stack">
        <section className="panel">
          <PanelTitle title="30 个 Sheet 分类地图" subtitle="所有模块都可以回到原始 sheet 和原始行，方便核对 Excel 正文。" />
          <div className="segmented compact">
            {modules.map((item) => <button key={item} className={moduleId === item ? 'selected' : ''} onClick={() => setModuleId(item)}>{item === '全部' ? '全部' : moduleById[item]?.label || item}</button>)}
          </div>
          <div className="sheet-grid">
            {sheets.map((sheet) => (
              <button className={openIndex === sheet.index ? 'sheet-card selected' : 'sheet-card'} key={sheet.index} onClick={() => setOpenIndex(openIndex === sheet.index ? null : sheet.index)}>
                <span>Sheet {sheet.index}</span>
                <b>{sheet.displayTitle}</b>
                <small>{moduleById[sheet.moduleId]?.label || '总览'} · {sheet.rows} 行</small>
              </button>
            ))}
          </div>
        </section>
        {openSheet && (
          <section className="panel">
            <PanelTitle title={`Sheet ${openSheet.index} · ${openSheet.title}`} subtitle="以下为抽取到的非空原始行，最多保留前 12 列。" />
            <RawRows rows={openSheet.rows} />
          </section>
        )}
      </div>
      <ModuleRail moduleId="source" />
    </div>
  );
}

function ModuleRail({ moduleId, activeRefs }) {
  const sheets = data.sheetCategories.filter((sheet) => moduleId === 'dashboard' ? true : sheet.moduleId === moduleId);
  const module = moduleById[moduleId] || { label: '总览', description: '整本工作簿概览' };
  return (
    <aside className="module-rail">
      <p className="section-label">课程详情</p>
      <h2>{module.label}</h2>
      <p>{module.description}</p>
      <div className="rail-stats">
        <Stat value={sheets.length} label="关联 Sheet" />
        <Stat value={sheets.reduce((sum, sheet) => sum + sheet.rows, 0)} label="来源行数" />
      </div>
      {activeRefs?.length > 0 && (
        <div className="trace-box">
          <b>当前来源</b>
          <SourcePills refs={activeRefs} />
        </div>
      )}
      <div className="source-list">
        {sheets.slice(0, 10).map((sheet) => (
          <a href="#/source" key={sheet.index}>
            <span>Sheet {sheet.index}</span>
            <b>{sheet.displayTitle}</b>
          </a>
        ))}
      </div>
    </aside>
  );
}

function CardioCalculator({ compact: isCompact = false }) {
  const restOptions = [...new Set(data.cardio.map((item) => item.restingHeartRate))].filter(Boolean);
  const [rest, setRest] = useState(restOptions[0] || '60');
  const [heart, setHeart] = useState('120');
  const [weight, setWeight] = useState('70');
  const [hours, setHours] = useState('2');
  const entry = data.cardio.find((item) => item.restingHeartRate === rest && item.exerciseHeartRate === heart) || data.cardio[0];
  const kcalHour = entry ? Math.round(Number(entry.kcalPerKg) * Number(weight || 0)) : 0;
  const daily = Math.round((kcalHour * Number(hours || 0)) / 7);

  return (
    <section className="panel tool-panel">
      <PanelTitle title="有氧热量消耗" subtitle="按静息心率、运动心率和体重估算每小时消耗。" />
      <div className={isCompact ? 'tool-grid compact' : 'tool-grid'}>
        <Field label="静息心率"><select value={rest} onChange={(event) => setRest(event.target.value)}>{restOptions.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="运动心率"><input value={heart} onChange={(event) => setHeart(event.target.value)} /></Field>
        <Field label="体重 kg"><input value={weight} onChange={(event) => setWeight(event.target.value)} /></Field>
        <Field label="每周小时"><input value={hours} onChange={(event) => setHours(event.target.value)} /></Field>
      </div>
      <div className="calc-result">
        <strong>{kcalHour || '-'} kcal/小时</strong>
        <span>折算每日：{daily || '-'} kcal · {formatSources(entry?.sourceRefs)}</span>
      </div>
    </section>
  );
}

function OneRepMaxCalculator({ compact: isCompact = false }) {
  const [weight, setWeight] = useState('50');
  const [reps, setReps] = useState('10');
  const w = Number(weight || 0);
  const r = Number(reps || 0);
  const results = data.oneRepMax.map((row) => ({ ...row, value: safeEval(row.expression, w, r) }));
  const avg = Math.round(results.reduce((sum, row) => sum + row.value, 0) / Math.max(results.length, 1));

  return (
    <section className="panel tool-panel">
      <PanelTitle title="最大力量预测" subtitle="输入配重和接近力竭次数，估算卧推/深蹲 1RM。" />
      <div className={isCompact ? 'tool-grid compact' : 'tool-grid'}>
        <Field label="配重 kg"><input value={weight} onChange={(event) => setWeight(event.target.value)} /></Field>
        <Field label="力竭次数"><input value={reps} onChange={(event) => setReps(event.target.value)} /></Field>
      </div>
      <div className="calc-result">
        <strong>{avg || '-'} kg</strong>
        <span>九个公式平均值 · Sheet 24</span>
      </div>
      {!isCompact && <Table headers={['公式', '预测值', '备注', '来源']} rows={results.map((row) => [row.author, `${row.value.toFixed(1)} kg`, row.note, formatSources(row.sourceRefs)])} />}
    </section>
  );
}

function FoodCalculator() {
  const [foodId, setFoodId] = useState(data.foods[0]?.id);
  const [target, setTarget] = useState('50');
  const food = data.foods.find((item) => item.id === foodId) || data.foods[0];
  const amount = convertFoodWeight(Number(target || 0), food);
  return (
    <div className="tool-grid">
      <Field label="选择食物"><select value={foodId} onChange={(event) => setFoodId(event.target.value)}>{data.foods.map((item) => <option key={item.id} value={item.id}>{item.macroType} · {item.name}</option>)}</select></Field>
      <Field label={`目标${food?.macroType || ''}克数`}><input value={target} onChange={(event) => setTarget(event.target.value)} /></Field>
      <div className="calc-result inline"><strong>{amount ? `${amount.value} ${amount.unit}` : '无法换算'}</strong><span>{food?.name} · 营养率 {food?.rate} · {formatSources(food?.sourceRefs)}</span></div>
    </div>
  );
}

function safeEval(expression, w, r) {
  const fns = {
    'w/(1-0.02*r)': () => w / (1 - 0.02 * r),
    '(r*0.0328+0.9849)*w': () => (r * 0.0328 + 0.9849) * w,
    'w/(1.0278-0.0278*r)': () => w / (1.0278 - 0.0278 * r),
    'w/(1.013-0.0267123*r)': () => w / (1.013 - 0.0267123 * r),
    'w*(r**0.1)': () => w * r ** 0.1,
    'w/(0.522+0.419*math.exp(-0.055*r))': () => w / (0.522 + 0.419 * Math.exp(-0.055 * r)),
    '0.025*w*r+w': () => 0.025 * w * r + w,
    'w/(0.488+0.538*math.exp(-0.075*r))': () => w / (0.488 + 0.538 * Math.exp(-0.075 * r)),
    '(r*0.0333)*w+w': () => r * 0.0333 * w + w,
  };
  const value = fns[expression]?.() || 0;
  return Number.isFinite(value) ? value : 0;
}

function Segmented({ items, selectedId, onSelect, getLabel }) {
  return (
    <div className="segmented">
      {items.map((item) => <button key={item.id} className={item.id === selectedId ? 'selected' : ''} onClick={() => onSelect(item.id)}>{getLabel(item)}</button>)}
    </div>
  );
}

function MealList({ title, rows }) {
  return (
    <div className="sub-panel">
      <h3>{title}</h3>
      <div className="meal-list">
        {rows.map((row) => <p key={row.row}><span>第 {row.row} 行</span>{row.text}</p>)}
        {!rows.length && <Empty text="没有匹配的餐食行。" />}
      </div>
    </div>
  );
}

function QaList({ items }) {
  return (
    <div className="qa-list">
      {items.map((item, index) => (
        <details className="qa-item" key={`${item.id}-${index}`}>
          <summary><span>{item.category}</span>{item.question}</summary>
          <p>{item.answer || '原表中该问题暂无正文。'}</p>
          <SourcePills refs={item.sourceRefs} />
        </details>
      ))}
      {!items.length && <Empty text="没有匹配的问答。" />}
    </div>
  );
}

function RawRows({ rows }) {
  return (
    <div className="raw-list">
      {rows.map((row) => (
        <p key={row.row}><span>{row.row}</span>{row.values.filter(Boolean).join(' ｜ ')}</p>
      ))}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function SourcePills({ refs = [] }) {
  if (!refs?.length) return null;
  return (
    <div className="source-pills">
      {refs.slice(0, 3).map((ref, index) => <span key={`${ref.sheetIndex}-${ref.row || ref.rowRange}-${index}`}>{formatSource(ref)}</span>)}
    </div>
  );
}

function formatSource(ref) {
  if (!ref) return '来源未知';
  const sheet = `Sheet ${ref.sheetIndex}`;
  if (ref.row) return `${sheet} · 第 ${ref.row} 行`;
  if (ref.rowRange) return `${sheet} · 行 ${ref.rowRange}`;
  return `${sheet} · ${sheetByIndex[ref.sheetIndex]?.title || ref.sheetTitle || ''}`;
}

function formatSources(refs = []) {
  if (!refs?.length) return '来源待查';
  return refs.slice(0, 2).map(formatSource).join(' / ');
}

function PanelTitle({ title, subtitle }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Empty({ text }) {
  return <p className="empty">{text}</p>;
}

function Lightbox({ image, close }) {
  return (
    <div className="lightbox" onClick={close}>
      <div className="lightbox-bar">
        <b>{image.title} · {image.label}</b>
        <button onClick={close}>关闭</button>
      </div>
      <img src={image.src} alt={`${image.title} ${image.label}`} onClick={(event) => event.stopPropagation()} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

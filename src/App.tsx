// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from 'react';
import { Empty, Field, PageLoading, PanelTitle, Stat } from './components/ui/course-primitives';
import { DataContext, useAppData } from './lib/app-data';
import { deleteCalorieRecord, getCalorieRecords, upsertCalorieRecord } from './lib/calorie-store';
import { coreLoader, routeFromHash, routeLoaders } from './lib/data-loaders';
import {
  femaleMuscleGainRatios,
  lookupRatio,
  maleFatLossRatios,
  maleMuscleGainRatios,
} from './lib/fitness-ratios';
import { compact, matches } from './lib/search';
const routes = [
  { id: 'dashboard', hash: '#/', label: '总览', mark: '01' },
  { id: 'fat-loss', hash: '#/fat-loss', label: '减脂饮食', mark: '02' },
  { id: 'muscle-gain', hash: '#/muscle-gain', label: '增肌饮食', mark: '03' },
  { id: 'training', hash: '#/training', label: '训练计划', mark: '04' },
  { id: 'tools', hash: '#/tools', label: '热量工具', mark: '05' },
  { id: 'foods', hash: '#/foods', label: '食物营养', mark: '06' },
  { id: 'qa', hash: '#/qa', label: '问答库', mark: '07' },
  { id: 'anatomy', hash: '#/anatomy', label: '拉伸解剖', mark: '08' },
  { id: 'source', hash: '#/source', label: '资料下载', mark: '09' },
];

const excelDownloadPath = '/generated/assets/【可任意分享】健身Excel超级套表（作者：B站好人松松）26年4月最新版.xlsx';

function NotFound() {
  return (
    <div className="not-found mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center">
      <h2>404</h2>
      <p>页面不存在</p>
      <a href="#/">返回首页</a>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(routeFromHash());
  const [query, setQuery] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [coreData, setCoreData] = useState(null);
  const [routeData, setRouteData] = useState({ routeKey: null, queryKey: null, payload: {} });
  const [isLoadingData, setIsLoadingData] = useState(true);

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

  useEffect(() => {
    let active = true;
    coreLoader().then((data) => {
      if (active) setCoreData(data);
    }).catch((error) => {
      console.error('Failed to load core data', error);
      if (active) setCoreData({ loadError: error });
    });
    return () => {
      active = false;
    };
  }, []);

  const active = routes.find((item) => item.id === route);
  const routeKey = active?.id || 'dashboard';
  const queryKey = routeKey === 'dashboard' ? query.trim() : '';

  useEffect(() => {
    let activeLoad = true;
    const loader = routeLoaders[routeKey] || routeLoaders.dashboard;
    setIsLoadingData(true);
    loader({ query }).then((data) => {
      if (!activeLoad) return;
      setRouteData({ routeKey, queryKey, payload: data });
      setIsLoadingData(false);
    }).catch((error) => {
      console.error('Failed to load route data', error);
      if (!activeLoad) return;
      setRouteData({ routeKey, queryKey, payload: { loadError: error } });
      setIsLoadingData(false);
    });
    return () => {
      activeLoad = false;
    };
  }, [routeKey, queryKey]);

  if (!coreData || coreData.loadError) {
    return <PageLoading text={coreData?.loadError ? '数据加载失败，请刷新重试。' : '正在加载 FitKnow 数据…'} />;
  }

  const hasCurrentRouteData = routeData.routeKey === routeKey && routeData.queryKey === queryKey;
  const currentRouteData = hasCurrentRouteData ? routeData.payload : {};
  const isRouteLoading = isLoadingData || !hasCurrentRouteData;
  const data = { ...coreData, ...currentRouteData };
  if (!active) {
    return (
      <DataContext.Provider value={data}>
        <Shell active={routes[0]} query={query} setQuery={setQuery}>
          <NotFound />
        </Shell>
      </DataContext.Provider>
    );
  }

  return (
    <DataContext.Provider value={data}>
      <Shell active={active} query={query} setQuery={setQuery}>
        {isRouteLoading && <PageLoading text="正在加载本页数据…" />}
        {!isRouteLoading && currentRouteData.loadError && <Empty text="本页数据加载失败，请刷新重试。" />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'dashboard' && <Dashboard query={query} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'fat-loss' && <DietCourse goal="fat-loss" query={query} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'muscle-gain' && <DietCourse goal="muscle-gain" query={query} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'training' && <TrainingCourse query={query} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'tools' && <ToolsCourse />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'foods' && <FoodsCourse query={query} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'qa' && <QaCourse query={query} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'anatomy' && <AnatomyCourse query={query} openLightbox={setLightbox} />}
        {!isRouteLoading && !currentRouteData.loadError && active.id === 'source' && <SourceIndex query={query} />}
      </Shell>
      {lightbox && <Lightbox image={lightbox} close={() => setLightbox(null)} />}
    </DataContext.Provider>
  );
}

function Shell({ active, query, setQuery, children }) {
  return (
    <div className="app-shell min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sidebar border-b border-white/10 lg:border-b-0 lg:border-r lg:border-r-white/10">
        <a className="brand group" href="#/">
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
      <div className="workspace min-w-0">
        <header className="topbar border-b border-[color:var(--line)] bg-[color:var(--topbar-bg)]">
          <div className="min-w-0">
            <p className="kicker">饮食 · 训练 · 工具 · 问答</p>
            <h1>{active.label}</h1>
          </div>
          <label className="search">
            <span>搜索动作 / 食物 / 问题</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="高位下拉 / 鸡胸肉 / 减脂不掉秤" />
          </label>
        </header>
        <main key={active.id} className="page-enter min-w-0 px-4 py-5 sm:px-6 sm:py-7">{children}</main>
      </div>
    </div>
  );
}

function SourceSummary() {
  const data = useAppData();
  return (
    <div className="source-box rounded-3xl border border-white/10 bg-white/5 p-4 shadow-none">
      <b>资料下载</b>
      <a href={excelDownloadPath} download>{data.source}</a>
      <small>更新：{new Date(data.generatedAt).toLocaleString('zh-CN')}</small>
    </div>
  );
}

function Dashboard({ query }) {
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
            <ResultList items={results} />
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
      <ModuleRail moduleId="dashboard" />
    </div>
  );
}

function useSearchResults(query) {
  const data = useAppData();
  return useMemo(() => {
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

function ResultList({ items }) {
  if (!items.length) return <Empty text="没有找到匹配内容。" />;
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

function DietCourse({ goal, query }) {
  const data = useAppData();
  const plans = (data.dietPlans || []).filter((plan) => plan.goal === goal);
  const [selectedId, setSelectedId] = useState(plans[0]?.id);
  const [fatLossTrainingMode, setFatLossTrainingMode] = useState('strength');
  const strengthPlans = plans.filter((plan) => !isNoStrengthPlan(plan));
  const noStrengthPlan = plans.find((plan) => isNoStrengthPlan(plan));
  const selectablePlans = goal === 'fat-loss'
    ? fatLossTrainingMode === 'no-strength'
      ? (noStrengthPlan ? [noStrengthPlan] : [])
      : strengthPlans
    : plans;
  const selected = selectablePlans.find((plan) => plan.id === selectedId) || selectablePlans[0] || plans[0];
  const category = goal === 'fat-loss' ? '减脂' : '增肌';
  const relatedQa = (data.qa || []).filter((item) => item.category === category && matches(item, query)).slice(0, 8);
  const filterRows = (rows = []) => rows.filter((row) => matches(row, query)).slice(0, 60);
  const hasStrengthPathSelector = goal !== 'fat-loss' || fatLossTrainingMode === 'strength';
  const trainingModeSelector = goal === 'fat-loss' ? (
    <div className="path-selector-inline training-mode-selector">
      <PanelTitle title="是否安排力量训练" subtitle="先确认是否做力训；选择无力训后，会直接使用无力训者饮食方案。" />
      <Segmented
        items={[
          { id: 'strength', label: '有力训' },
          { id: 'no-strength', label: '无力训' },
        ]}
        selectedId={fatLossTrainingMode}
        onSelect={setFatLossTrainingMode}
        getLabel={(item) => item.label}
      />
    </div>
  ) : null;
  const pathSelector = hasStrengthPathSelector ? (
    <div className="path-selector-inline">
      <PanelTitle
        title={`${category}饮食路径`}
        subtitle={goal === 'fat-loss' ? '选择训练发生的时间，下面会切换对应的力训日和休息日饮食表。' : '选择训练发生的时间，下面会切换对应的力训日、休息日或每日饮食表。'}
      />
      <Segmented items={selectablePlans} selectedId={selected?.id} onSelect={setSelectedId} getLabel={(item) => item.timing} />
    </div>
  ) : null;

  return (
    <div className="course-layout">
      <div className="content-stack">
        {selected && (
          <section className="panel">
            <GoalInputPlanner
              goal={goal}
              plan={selected}
              query={query}
              topSelector={trainingModeSelector}
              pathSelector={pathSelector}
            />
            <PanelTitle title="执行说明" subtitle="整理输入项、调整规则和执行注意事项，方便按当前目标落地。" />
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
          </section>
        )}
        <section className="panel">
          <PanelTitle title={`${category}常见问题`} subtitle="把执行中最容易卡住的问题放在饮食路径旁边。" />
          <QaList items={relatedQa} />
        </section>
      </div>
      <ModuleRail moduleId={goal} />
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

function GoalInputPlanner({ goal, plan, query = '', topSelector = null, pathSelector = null }) {
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
          <p>{isFatLoss ? '估算无运动总消耗、力训/休息日平衡热量和应吃热量，再结合配额表拆到每餐。' : '估算无运动总消耗、力训/休息日平衡热量和应吃热量，再结合增肌配额拆到每餐。'}</p>
        </div>
      </div>

      {topSelector}

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

      {isFatLoss && <CalorieDeficitTracker metrics={metrics} noStrength={isNoStrength} />}

      {pathSelector}
      <StructuredMealTables plan={plan} metrics={metrics} query={query} />
    </div>
  );
}

const BODY_FAT_KCAL_PER_KG = 7700;

function CalorieDeficitTracker({ metrics, noStrength }) {
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(() => getLocalDateString());
  const [intakeCalories, setIntakeCalories] = useState('');
  const [dayType, setDayType] = useState(noStrength ? 'daily' : 'training');
  const [editingDate, setEditingDate] = useState('');
  const [editingIntakeCalories, setEditingIntakeCalories] = useState('');
  const [editingDayType, setEditingDayType] = useState(noStrength ? 'daily' : 'training');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    getCalorieRecords().then((loadedRecords) => {
      if (active) setRecords(loadedRecords);
    }).catch((storageError) => {
      console.error('Failed to load calorie records', storageError);
      if (active) setError(storageError.message || '读取本地热量记录失败。');
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setDayType((current) => {
      if (noStrength) return 'daily';
      return current === 'daily' ? 'training' : current;
    });
    setEditingDayType((current) => {
      if (noStrength) return 'daily';
      return current === 'daily' ? 'training' : current;
    });
  }, [noStrength]);

  useEffect(() => {
    const existing = records.find((record) => record.date === date);
    if (existing) {
      setIntakeCalories(String(existing.intakeCalories));
      setDayType(noStrength ? 'daily' : existing.dayType === 'daily' ? 'training' : existing.dayType);
      return;
    }

    setIntakeCalories('');
    setDayType(noStrength ? 'daily' : 'training');
  }, [date, records, noStrength]);

  const normalizedDayType = noStrength ? 'daily' : dayType === 'rest' ? 'rest' : 'training';
  const selectedTdee = getTdeeForDayType(metrics, normalizedDayType);
  const parsedIntake = Number.parseFloat(intakeCalories);
  const hasValidIntake = Number.isFinite(parsedIntake) && parsedIntake >= 0;
  const currentDeficit = hasValidIntake ? Math.round(selectedTdee - parsedIntake) : null;
  const selectedDateRecord = records.find((record) => record.date === date);
  const recentRecords = records.slice(0, 14);
  const recent7Records = useMemo(() => {
    const startDate = getLocalDateString(-6);
    const endDate = getLocalDateString();
    return records.filter((record) => record.date >= startDate && record.date <= endDate);
  }, [records]);
  const averageDeficit = recent7Records.length
    ? Math.round(recent7Records.reduce((sum, record) => sum + record.deficit, 0) / recent7Records.length)
    : null;
  const predictedDays = averageDeficit && averageDeficit > 0
    ? Math.ceil(BODY_FAT_KCAL_PER_KG / averageDeficit)
    : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!date) {
      setError('请先选择日期。');
      return;
    }

    if (!hasValidIntake) {
      setError('请输入有效的每日实际饮食热量。');
      return;
    }

    if (!selectedTdee) {
      setError('当前 TDEE 无法计算，请先检查身高、体重、年龄和运动消耗。');
      return;
    }

    setIsSaving(true);
    try {
      const roundedIntake = Math.round(parsedIntake);
      const savedRecord = await upsertCalorieRecord({
        date,
        intakeCalories: roundedIntake,
        dayType: normalizedDayType,
        tdee: selectedTdee,
        deficit: Math.round(selectedTdee - roundedIntake),
      });

      setRecords((current) => sortCalorieRecords([
        savedRecord,
        ...current.filter((record) => record.date !== savedRecord.date),
      ]));
      setMessage(selectedDateRecord ? '已更新当天记录。' : '已保存当天记录。');
    } catch (storageError) {
      console.error('Failed to save calorie record', storageError);
      setError(storageError.message || '保存本地热量记录失败。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (record) => {
    setEditingDate(record.date);
    setEditingIntakeCalories(String(record.intakeCalories));
    setEditingDayType(noStrength ? 'daily' : record.dayType === 'daily' ? 'training' : record.dayType);
    setMessage('');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingDate('');
    setEditingIntakeCalories('');
    setEditingDayType(noStrength ? 'daily' : 'training');
    setMessage('');
    setError('');
  };

  const handleSaveInlineEdit = async (record) => {
    const normalizedEditDayType = noStrength ? 'daily' : editingDayType === 'rest' ? 'rest' : 'training';
    const parsedEditIntake = Number.parseFloat(editingIntakeCalories);
    const editTdee = getTdeeForDayType(metrics, normalizedEditDayType);

    setMessage('');
    setError('');

    if (!Number.isFinite(parsedEditIntake) || parsedEditIntake < 0) {
      setError('请输入有效的每日实际饮食热量。');
      return;
    }

    if (!editTdee) {
      setError('当前 TDEE 无法计算，请先检查身高、体重、年龄和运动消耗。');
      return;
    }

    setIsSaving(true);
    try {
      const roundedIntake = Math.round(parsedEditIntake);
      const savedRecord = await upsertCalorieRecord({
        date: record.date,
        intakeCalories: roundedIntake,
        dayType: normalizedEditDayType,
        tdee: editTdee,
        deficit: Math.round(editTdee - roundedIntake),
      });

      setRecords((current) => sortCalorieRecords([
        savedRecord,
        ...current.filter((currentRecord) => currentRecord.date !== savedRecord.date),
      ]));
      setEditingDate('');
      setEditingIntakeCalories('');
      setMessage('已更新当天记录。');
    } catch (storageError) {
      console.error('Failed to save calorie record', storageError);
      setError(storageError.message || '保存本地热量记录失败。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (recordDate) => {
    setMessage('');
    setError('');

    try {
      await deleteCalorieRecord(recordDate);
      setRecords((current) => current.filter((record) => record.date !== recordDate));
      if (recordDate === date) setIntakeCalories('');
      if (recordDate === editingDate) handleCancelEdit();
      setMessage('已删除记录。');
    } catch (storageError) {
      console.error('Failed to delete calorie record', storageError);
      setError(storageError.message || '删除本地热量记录失败。');
    }
  };

  const handleExport = () => {
    setMessage('');
    setError('');

    if (!records.length) {
      setError('还没有可导出的热量记录。');
      return;
    }

    downloadCalorieRecordsAsExcel(records);
    setMessage('已导出 Excel 文件。');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setMessage('');
    setError('');

    if (!file) return;

    if (file.name.toLowerCase().endsWith('.xlsx')) {
      setError('暂不支持直接导入 .xlsx，请先另存为 CSV，或导入本功能导出的 .xls 文件。');
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const importedRecords = parseImportedCalorieRecords(text, metrics, noStrength);

      if (!importedRecords.length) {
        setError('没有识别到可导入的有效记录。');
        return;
      }

      const savedRecords = [];
      for (const importedRecord of importedRecords) {
        const savedRecord = await upsertCalorieRecord(importedRecord);
        savedRecords.push(savedRecord);
      }

      setRecords((current) => sortCalorieRecords([
        ...savedRecords,
        ...current.filter((record) => !savedRecords.some((savedRecord) => savedRecord.date === record.date)),
      ]));
      setMessage(`已导入 ${savedRecords.length} 条记录。`);
    } catch (importError) {
      console.error('Failed to import calorie records', importError);
      setError(importError.message || '导入失败，请检查文件格式。');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="calorie-tracker" aria-labelledby="calorie-tracker-title">
      <div className="calorie-tracker-head">
        <div>
          <p className="section-label">本地记录</p>
          <h3 id="calorie-tracker-title">每日热量缺口</h3>
          <p>输入每日实际饮食热量，按 TDEE - 摄入计算缺口，并用最近 7 天记录预测减 1kg 脂肪需要多久。</p>
        </div>
        <div className="calorie-tracker-side">
          <div className="calorie-tracker-formula">
            <strong>1kg 体脂 ≈ 7700 kcal</strong>
            <span>天数 = 7700 ÷ 平均每日缺口</span>
          </div>
          <div className="calorie-file-actions">
            <button type="button" onClick={handleExport}>导出 Excel</button>
            <button type="button" onClick={handleImportClick} disabled={isImporting}>
              {isImporting ? '导入中' : '导入数据'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.csv,.tsv,.txt,.json"
              onChange={handleImportFile}
            />
          </div>
        </div>
      </div>

      <form className="calorie-entry-form" onSubmit={handleSubmit}>
        <Field label="日期">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label="日类型">
          <select value={normalizedDayType} onChange={(event) => setDayType(event.target.value)} disabled={noStrength}>
            <option value="training">力训日</option>
            <option value="rest">休息日</option>
            <option value="daily">每日</option>
          </select>
        </Field>
        <Field label="实际摄入 kcal">
          <input
            inputMode="decimal"
            min="0"
            placeholder="例如 1800"
            value={intakeCalories}
            onChange={(event) => setIntakeCalories(event.target.value)}
          />
        </Field>
        <button className="calorie-save-button" type="submit" disabled={isSaving}>
          {isSaving ? '保存中' : selectedDateRecord ? '更新记录' : '保存记录'}
        </button>
      </form>

      <div className="calorie-stat-grid">
        <Stat value={`${selectedTdee || '-'} kcal`} label={`${dayTypeLabel(normalizedDayType)} TDEE`} />
        <Stat value={hasValidIntake ? `${Math.round(parsedIntake)} kcal` : '-'} label="当日摄入" />
        <Stat value={currentDeficit === null ? '-' : `${Math.abs(currentDeficit)} kcal`} label={deficitLabel(currentDeficit)} />
        <Stat value={predictedDays ? `${predictedDays} 天` : '-'} label="预计减 1kg 脂肪" />
      </div>

      <div className="calorie-forecast">
        <b>最近 7 天平均缺口</b>
        <p>
          {averageDeficit === null
            ? '还没有最近 7 天记录，保存每日摄入后会自动计算。'
            : averageDeficit > 0
              ? `已有 ${recent7Records.length} 条记录，平均每日缺口 ${averageDeficit} kcal，预计约 ${predictedDays} 天减少 1kg 脂肪。`
              : `已有 ${recent7Records.length} 条记录，当前平均不是热量缺口，无法预测减脂时间。`}
        </p>
      </div>

      {(message || error) && (
        <p className={error ? 'calorie-message error' : 'calorie-message'}>
          {error || message}
        </p>
      )}

      <div className="calorie-records">
        <div className="calorie-records-head">
          <h4>最近记录</h4>
          <span>最多显示 14 条</span>
        </div>
        {recentRecords.length ? (
          <div className="calorie-record-list">
            {recentRecords.map((record) => {
              const isEditing = editingDate === record.date;
              const normalizedEditingDayType = noStrength ? 'daily' : editingDayType === 'rest' ? 'rest' : 'training';
              const editTdee = getTdeeForDayType(metrics, normalizedEditingDayType);
              const parsedEditingIntake = Number.parseFloat(editingIntakeCalories);
              const editingDeficit = Number.isFinite(parsedEditingIntake)
                ? Math.round(editTdee - parsedEditingIntake)
                : null;

              return (
                <article className={`calorie-record ${isEditing ? 'is-editing' : ''}`} key={record.date}>
                  <div>
                    <strong>{record.date}</strong>
                    {isEditing ? (
                      <div className="calorie-inline-fields">
                        <label>
                          <span>日类型</span>
                          <select value={normalizedEditingDayType} onChange={(event) => setEditingDayType(event.target.value)} disabled={noStrength}>
                            <option value="training">力训日</option>
                            <option value="rest">休息日</option>
                            <option value="daily">每日</option>
                          </select>
                        </label>
                        <label>
                          <span>实际摄入 kcal</span>
                          <input
                            inputMode="decimal"
                            min="0"
                            value={editingIntakeCalories}
                            onChange={(event) => setEditingIntakeCalories(event.target.value)}
                          />
                        </label>
                      </div>
                    ) : (
                      <span>{dayTypeLabel(record.dayType)} · TDEE {record.tdee} kcal · 摄入 {record.intakeCalories} kcal</span>
                    )}
                  </div>
                  <b className={(isEditing ? editingDeficit ?? record.deficit : record.deficit) >= 0 ? 'deficit' : 'surplus'}>
                    {isEditing && editingDeficit !== null ? deficitSummary(editingDeficit) : deficitSummary(record.deficit)}
                  </b>
                  <div className="calorie-record-actions">
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => handleSaveInlineEdit(record)} disabled={isSaving}>
                          {isSaving ? '保存中' : '保存'}
                        </button>
                        <button type="button" onClick={handleCancelEdit}>取消</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => handleEdit(record)}>编辑</button>
                        <button type="button" onClick={() => handleDelete(record.date)}>删除</button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty">还没有热量记录。</p>
        )}
      </div>
    </section>
  );
}

function getLocalDateString(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function sortCalorieRecords(records) {
  return [...records].sort((left, right) => right.date.localeCompare(left.date));
}

function getTdeeForDayType(metrics, dayType) {
  if (dayType === 'training') return Math.round(Number(metrics.trainingMaintenanceCalories || 0));
  if (dayType === 'rest') return Math.round(Number(metrics.restMaintenanceCalories || 0));
  return Math.round(Number(metrics.maintenanceCalories || metrics.restMaintenanceCalories || 0));
}

function dayTypeLabel(dayType) {
  if (dayType === 'training') return '力训日';
  if (dayType === 'rest') return '休息日';
  return '每日';
}

function deficitLabel(deficit) {
  if (deficit === null) return '缺口 / 盈余';
  if (deficit > 0) return '当日热量缺口';
  if (deficit < 0) return '当日热量盈余';
  return '当日热量平衡';
}

function deficitSummary(deficit) {
  if (deficit > 0) return `缺口 ${deficit} kcal`;
  if (deficit < 0) return `盈余 ${Math.abs(deficit)} kcal`;
  return '平衡 0 kcal';
}

function downloadCalorieRecordsAsExcel(records) {
  const headers = ['日期', '日类型', '实际摄入 kcal', 'TDEE kcal', '缺口 kcal', '创建时间', '更新时间'];
  const rows = sortCalorieRecords(records).map((record) => [
    record.date,
    dayTypeLabel(record.dayType),
    record.intakeCalories,
    record.tdee,
    record.deficit,
    record.createdAt,
    record.updatedAt,
  ]);
  const tableRows = [headers, ...rows]
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  const html = `\uFEFF<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; }
    th, td { border: 1px solid #d9e2dc; padding: 6px 10px; }
    tr:first-child td { background: #16724f; color: #ffffff; font-weight: bold; }
  </style>
</head>
<body>
  <table>${tableRows}</table>
</body>
</html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `fitknow-calorie-records-${getLocalDateString()}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseImportedCalorieRecords(text, metrics, noStrength) {
  const rows = parseImportedRows(text);

  return rows.map((row) => normalizeImportedCalorieRecord(row, metrics, noStrength)).filter(Boolean);
}

function parseImportedRows(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.records)) return parsed.records;
    if (Array.isArray(parsed.dailyCalorieRecords)) return parsed.dailyCalorieRecords;
    return [];
  }

  if (/<table[\s>]/i.test(trimmed)) {
    return tableRowsToObjects(parseHtmlTableRows(trimmed));
  }

  const delimiter = trimmed.includes('\t') ? '\t' : ',';
  return tableRowsToObjects(parseDelimitedRows(trimmed, delimiter));
}

function parseHtmlTableRows(html) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(document.querySelectorAll('tr')).map((row) => (
    Array.from(row.querySelectorAll('th,td')).map((cell) => cell.textContent?.trim() || '')
  )).filter((row) => row.some(Boolean));
}

function parseDelimitedRows(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function tableRowsToObjects(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => normalizeImportHeader(header));

  return rows.slice(1).map((row) => headers.reduce((object, header, index) => {
    if (header) object[header] = row[index] ?? '';
    return object;
  }, {}));
}

function normalizeImportedCalorieRecord(row, metrics, noStrength) {
  const date = normalizeImportDate(readImportField(row, ['date', '日期']));
  const intakeCalories = parseImportNumber(readImportField(row, ['intakeCalories', 'actualIntake', 'intake', '实际摄入 kcal', '实际摄入', '摄入', '摄入热量']));
  const dayType = normalizeImportDayType(readImportField(row, ['dayType', 'type', '日类型', '类型']), noStrength);
  const fallbackTdee = getTdeeForDayType(metrics, dayType);
  const importedTdee = parseImportNumber(readImportField(row, ['tdee', 'TDEE kcal', 'TDEE', '每日总消耗']));
  const tdee = importedTdee > 0 ? importedTdee : fallbackTdee;
  const importedDeficit = parseImportNumber(readImportField(row, ['deficit', '缺口 kcal', '热量缺口', '缺口']));

  if (!date || !Number.isFinite(intakeCalories) || intakeCalories < 0 || !tdee) return null;

  return {
    date,
    intakeCalories: Math.round(intakeCalories),
    dayType,
    tdee: Math.round(tdee),
    deficit: Number.isFinite(importedDeficit)
      ? Math.round(importedDeficit)
      : Math.round(tdee - intakeCalories),
  };
}

function readImportField(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && `${row[key]}`.trim() !== '') return row[key];
    const normalizedKey = normalizeImportHeader(key);
    if (row[normalizedKey] !== undefined && row[normalizedKey] !== null && `${row[normalizedKey]}`.trim() !== '') {
      return row[normalizedKey];
    }
  }
  return '';
}

function normalizeImportHeader(value) {
  return `${value || ''}`
    .replace(/\s+/g, '')
    .replace(/[()（）]/g, '')
    .toLowerCase();
}

function normalizeImportDate(value) {
  const text = `${value || ''}`.trim();
  if (!text) return '';

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text) || /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(text)) {
    const [year, month, day] = text.replace(/\//g, '-').split('-').map(Number);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  if (/^\d+(\.\d+)?$/.test(text)) {
    const serial = Number.parseFloat(text);
    if (serial > 20000 && serial < 80000) {
      const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      return date.toISOString().slice(0, 10);
    }
  }

  return '';
}

function normalizeImportDayType(value, noStrength) {
  if (noStrength) return 'daily';

  const text = `${value || ''}`.trim().toLowerCase();
  if (text.includes('rest') || text.includes('休息')) return 'rest';
  if (text.includes('daily') || text.includes('每日') || text.includes('无力训')) return 'daily';
  return 'training';
}

function parseImportNumber(value) {
  if (typeof value === 'number') return value;
  const text = `${value || ''}`.replace(/,/g, '').trim();
  if (!text) return Number.NaN;
  return Number.parseFloat(text);
}

function escapeHtml(value) {
  return `${value ?? ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

  // 使用好人松松比例表查表；增肌表三段为：训练日碳水 / 休息日碳水 / 每日蛋白质。
  let carbsRate, restCarbsRate, proteinRate, fatRate;
  if (sex === 'male' || goal === 'muscle-gain') {
    const table = goal === 'fat-loss'
      ? maleFatLossRatios
      : sex === 'female'
        ? femaleMuscleGainRatios
        : maleMuscleGainRatios;
    const ratios = lookupRatio(table, weight, height);
    if (goal === 'muscle-gain') {
      [carbsRate, restCarbsRate, proteinRate] = ratios;
      fatRate = 0.9;
    } else {
      [carbsRate, proteinRate, fatRate] = ratios;
      restCarbsRate = carbsRate * 0.82;
    }
  } else {
    carbsRate = 0; // 女性暂用旧公式计算
    restCarbsRate = 0;
    proteinRate = goal === 'fat-loss' ? 1.8 : 1.7;
    fatRate = goal === 'fat-loss' ? 0.75 : 0.9;
  }

  let trainingCarbs, trainingProtein, trainingFat, restCarbs, restProtein, restFat;

  if (carbsRate > 0) {
    // 力训日：比例 * 体重
    trainingCarbs = Math.round(weight * carbsRate);
    trainingProtein = Math.round(weight * proteinRate);
    trainingFat = Math.round(weight * fatRate);
    // 减脂表未单列休息日碳水，按训练日碳水折算；增肌表第二段就是休息日碳水。
    restCarbs = Math.round(weight * restCarbsRate);
    restProtein = trainingProtein;
    restFat = trainingFat;
  } else {
    // 没有录入配额表时回退：用旧公式
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
    restCarbsRate: Math.round(restCarbsRate * 100) / 100,
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

function findDefaultFood(options = [], macroType, foods = []) {
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
    restCarb: metrics.restCarbsRate ?? Math.round((metrics.restCarbs / metrics.weight) * 100) / 100,
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
              {visibleMeals.map((meal, index) => <MealCard key={`${table.dayType}-${meal.name}`} table={table} meal={meal} metrics={metrics} defaultOpen={index === 0} />)}
            </div>
            <MealGuidance guidance={guidance} />
          </section>
        );
      })}
    </div>
  );
}

function MealCard({ table, meal, metrics, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const targets = computeMealTargets(metrics, table, meal);
  return (
    <details className="meal-card" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary className="meal-card-title">
        <span>{meal.order}</span>
        <div>
          <h4>{meal.name.replace(/^[①②③④⑤]/, '')}</h4>
          <p>{meal.mealTypeLabel} · 碳水 {meal.carbPercent}% · 蛋白质 {meal.proteinPercent}%</p>
        </div>
      </summary>
      {isOpen && (
        <div className="meal-macro-columns">
          <MealFoodCell macroType="碳水" target={targets?.carb} options={meal.carbOptions} />
          <MealFoodCell macroType="蛋白质" target={targets?.protein} options={meal.proteinOptions} disabled={meal.proteinPercent === 0} />
        </div>
      )}
    </details>
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
  const data = useAppData();
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
  const data = useAppData();
  const [planId, setPlanId] = useState(data.trainingPlans[0]?.id);
  const [dayFilter, setDayFilter] = useState('全部');
  const plan = data.trainingPlans.find((item) => item.id === planId) || data.trainingPlans[0];
  const dayOptions = ['全部', ...plan.days.map((day) => day.title)];
  const days = plan.days
    .filter((day) => dayFilter === '全部' || day.title === dayFilter)
    .map((day) => {
      const introRow = getTrainingDayIntroRow(day.rows);
      const exerciseRows = getTrainingExerciseRows(day.rows).filter((row) => matches(row, query));
      return { ...day, introRow, exerciseRows };
    })
    .filter((day) => !query || matches({ ...day, rows: day.exerciseRows }, query) || day.exerciseRows.length);

  return (
    <div className="course-layout gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="content-stack gap-5">
        <section className="panel">
          <PanelTitle title="分化训练课程" subtitle="按场景和分化方式选择计划，再进入每一天的部位、组数、动作和关节提示。" />
          <Segmented items={data.trainingPlans} selectedId={plan.id} onSelect={setPlanId} getLabel={(item) => item.title} />
          <div className="segmented compact">
            {dayOptions.map((item) => <button key={item} className={item === dayFilter ? 'selected' : ''} onClick={() => setDayFilter(item)}>{item}</button>)}
          </div>
        </section>
        <section className="panel">
          <PanelTitle title="训练前知识准备" subtitle="先看通用训练原则，再进入下面的 Day 计划表。" />
          <TrainingInfoTable items={plan.info} />
        </section>
        <section className="panel">
          <PanelTitle title={plan.title} subtitle={`${plan.environment === 'home' ? '居家' : '健身房'} · ${plan.splitType}`} />
          {days.map((day) => (
            <details className="lesson-block" key={day.title} open>
              <summary>{day.title}</summary>
              {day.rationale && <p className="note">{day.rationale}</p>}
              <TrainingDayTable day={day} />
            </details>
          ))}
          {!days.length && <Empty text="没有匹配的训练内容。" />}
        </section>
      </div>
      <ModuleRail moduleId="training" />
    </div>
  );
}

function TrainingInfoTable({ items = [] }) {
  return (
    <div className="table-wrap">
      <table className="training-info-table">
        <tbody>
          {items.map((item) => (
            <tr key={item.label}>
              <th scope="row">{item.label}</th>
              <td>{item.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrainingDayTable({ day }) {
  const rows = hydrateTrainingRows(day.exerciseRows || [], day.title);
  const primaryJointLabel = getTrainingPrimaryJointLabel(day);

  return (
    <div className="table-wrap">
      <table className="training-day-table">
        <thead>
          <tr>
            <th colSpan={5} className="training-day-title">{day.title}</th>
          </tr>
          {day.introRow?.muscleGroup && (
            <tr>
              <td colSpan={5} className="training-day-intro">{day.introRow.muscleGroup}</td>
            </tr>
          )}
          <tr>
            <th rowSpan={2}>部位</th>
            <th rowSpan={2}>组数</th>
            <th rowSpan={2}>动作</th>
            <th colSpan={2}>关节活动</th>
          </tr>
          <tr>
            <th>{primaryJointLabel}</th>
            <th>肘关节</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.muscleGroup}-${row.setGuidance}-${row.exercise}-${index}`}>
              {shouldRenderTrainingGroupCell(rows, index, 'muscleGroup') && (
                <td rowSpan={getTrainingGroupRowSpan(rows, index, 'muscleGroup')} className="training-group-cell">{row.muscleGroup}</td>
              )}
              {shouldRenderTrainingGroupCell(rows, index, 'setGuidance') && (
                <td rowSpan={getTrainingGroupRowSpan(rows, index, 'setGuidance')} className="training-group-cell">{row.setGuidance}</td>
              )}
              <td>{row.exercise}</td>
              <td>{row.shoulderJoint}</td>
              <td>{row.elbowJoint}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
  const data = useAppData();
  const [macro, setMacro] = useState('全部');
  const foods = data.foods.filter((item) => (macro === '全部' || item.macroType === macro) && matches(item, query));
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
      <ModuleRail moduleId="foods" />
    </div>
  );
}

function QaCourse({ query }) {
  const data = useAppData();
  const [category, setCategory] = useState('全部');
  const items = data.qa.filter((item) => (category === '全部' || item.category === category) && matches(item, query));
  return (
    <div className="course-layout">
      <section className="panel content-stack">
        <PanelTitle title="减脂 / 增肌问答库" subtitle="整理常见执行问题，帮助你快速定位卡点。" />
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
  const data = useAppData();
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
          <Table headers={['关节', '活动', '通俗描述', '动作例', '参与肌肉']} rows={jointRows.map((row) => [row.joint, row.movement, row.description, row.example, row.muscles.join('、')])} />
          {anatomy.muscleSections.map((section) => (
            <details className="lesson-block" key={section.title}>
              <summary>{section.title}</summary>
              <Table headers={['关节', '活动', '通俗描述', '肌肉 / 动作']} rows={section.rows.filter((row) => matches(row, query)).map((row) => [row.joint, row.movement, row.description, row.targets.map((target) => `${target.muscle}: ${target.item}`).join('；')])} />
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

function SourceIndex() {
  const data = useAppData();
  return (
    <div className="course-layout">
      <div className="content-stack">
        <section className="panel download-panel">
          <PanelTitle title="资料下载" subtitle="下载原版表格资料，配合站内课程一起使用。" />
          <div className="download-card">
            <div>
              <p className="section-label">原版资料</p>
              <h3>{data.source}</h3>
              <p>站内内容已整理成饮食、训练、工具和问答模块；需要查看完整资料时，可以下载原版文件。</p>
              <small>更新：{new Date(data.generatedAt).toLocaleString('zh-CN')}</small>
            </div>
            <a className="primary-button" href={excelDownloadPath} download>下载 Excel</a>
          </div>
        </section>
      </div>
      <ModuleRail moduleId="source" />
    </div>
  );
}

const moduleDetails = {
  dashboard: { label: '总览', description: '从目标出发，快速进入饮食、训练、工具和问答。' },
  'fat-loss': { label: '减脂饮食', description: '按是否力训、训练时间和个人数据拆解每日饮食。' },
  'muscle-gain': { label: '增肌饮食', description: '按训练安排和体型数据规划碳水、蛋白质和餐次。' },
  training: { label: '训练计划', description: '按环境和分化方式查看每一天的部位、组数和动作。' },
  tools: { label: '热量工具', description: '估算有氧消耗、最大力量和食物重量。' },
  foods: { label: '食物营养', description: '查询常见食物的碳水、蛋白质和营养率。' },
  qa: { label: '问答库', description: '查看减脂、增肌执行中的常见问题。' },
  anatomy: { label: '拉伸解剖', description: '理解关节活动、参与肌肉和动作图示。' },
  source: { label: '资料下载', description: '下载原版表格资料，配合站内内容核对和学习。' },
};

function ModuleRail({ moduleId }) {
  const module = moduleDetails[moduleId] || moduleDetails.dashboard;
  const relatedRoutes = routes.filter((route) => route.id !== moduleId).slice(0, 6);
  return (
    <aside className="module-rail rounded-3xl border border-[color:var(--line)] bg-[color:var(--rail)] p-5 shadow-sm xl:sticky xl:top-24">
      <p className="section-label">模块概览</p>
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

function CardioCalculator({ compact: isCompact = false }) {
  const data = useAppData();
  const restOptions = [...new Set(data.cardio.map((item) => item.restingHeartRate))].filter(Boolean);
  const [rest, setRest] = useState(restOptions[0] || '60');
  const [heart, setHeart] = useState('120');
  const [weight, setWeight] = useState('70');
  const entry = data.cardio.find((item) => item.restingHeartRate === rest && item.exerciseHeartRate === heart) || data.cardio[0];
  const kcalHour = entry ? Math.round(Number(entry.kcalPerKg) * Number(weight || 0)) : 0;

  return (
    <section className="panel tool-panel">
      <PanelTitle title="有氧热量消耗" subtitle="按静息心率、运动心率和体重估算每小时消耗。" />
      <div className={isCompact ? 'tool-grid compact' : 'tool-grid'}>
        <Field label="静息心率"><select value={rest} onChange={(event) => setRest(event.target.value)}>{restOptions.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="运动心率"><input value={heart} onChange={(event) => setHeart(event.target.value)} /></Field>
        <Field label="体重 kg"><input value={weight} onChange={(event) => setWeight(event.target.value)} /></Field>
      </div>
      <div className="calc-result">
        <strong>{kcalHour || '-'} kcal/小时</strong>
        <span>{entry ? `${Number(entry.kcalPerKg).toFixed(1)} kcal/kg/小时 × ${Number(weight || 0)} kg` : '每 kg 体重消耗 × 当前体重'}</span>
      </div>
      {!isCompact && <CardioKcalTable rows={data.cardio} />}
    </section>
  );
}

function CardioKcalTable({ rows = [] }) {
  return (
    <div className="table-wrap">
      <table className="cardio-kcal-table">
        <thead>
          <tr>
            <th>静息心率</th>
            <th>运动心率</th>
            <th>每 kg 体重热量消耗</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.restingHeartRate}-${row.exerciseHeartRate}`}>
              {shouldRenderTrainingGroupCell(rows, index, 'restingHeartRate') && (
                <td rowSpan={getTrainingGroupRowSpan(rows, index, 'restingHeartRate')} className="training-group-cell">
                  静息心率 {row.restingHeartRate}
                </td>
              )}
              <td>运动心率 {row.exerciseHeartRate}</td>
              <td>{Number(row.kcalPerKg).toFixed(1)} kcal/kg/小时</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OneRepMaxCalculator({ compact: isCompact = false }) {
  const data = useAppData();
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
        <span>九个公式平均值</span>
      </div>
      {!isCompact && <Table headers={['公式', '预测值', '备注']} rows={results.map((row) => [row.author, `${row.value.toFixed(1)} kg`, row.note])} />}
    </section>
  );
}

function FoodCalculator() {
  const data = useAppData();
  const [foodId, setFoodId] = useState(data.foods[0]?.id);
  const [target, setTarget] = useState('50');
  const food = data.foods.find((item) => item.id === foodId) || data.foods[0];
  const amount = convertFoodWeight(Number(target || 0), food);
  return (
    <div className="tool-grid">
      <Field label="选择食物"><select value={foodId} onChange={(event) => setFoodId(event.target.value)}>{data.foods.map((item) => <option key={item.id} value={item.id}>{item.macroType} · {item.name}</option>)}</select></Field>
      <Field label={`目标${food?.macroType || ''}克数`}><input value={target} onChange={(event) => setTarget(event.target.value)} /></Field>
      <div className="calc-result inline"><strong>{amount ? `${amount.value} ${amount.unit}` : '无法换算'}</strong><span>{food?.name} · 营养率 {food?.rate}</span></div>
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
          <p>{item.answer || '暂无详细回答。'}</p>
        </details>
      ))}
      {!items.length && <Empty text="没有匹配的问答。" />}
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

function isTrainingDayIntroRow(row) {
  return row && !row.setGuidance && !row.exercise;
}

function getTrainingDayIntroRow(rows = []) {
  return isTrainingDayIntroRow(rows[0]) ? rows[0] : null;
}

function getTrainingExerciseRows(rows = []) {
  return getTrainingDayIntroRow(rows) ? rows.slice(1) : rows;
}

function hydrateTrainingRows(rows = [], title = '') {
  let currentMuscleGroup = getTrainingDefaultMuscleGroup(title);
  return rows.map((row) => {
    currentMuscleGroup = row.muscleGroup || currentMuscleGroup;
    return { ...row, muscleGroup: currentMuscleGroup };
  });
}

function getTrainingDefaultMuscleGroup(title = '') {
  return title.replace(/^Day\d+[：:]\s*/, '').split('+')[0]?.trim() || '';
}

function getTrainingPrimaryJointLabel(day) {
  const introLabel = day.introRow?.shoulderJoint;
  if (introLabel?.includes('关节')) return introLabel;
  if (day.title?.includes('腿') || day.title?.includes('臀')) return '膝关节';
  return '肩关节';
}

function shouldRenderTrainingGroupCell(rows, index, key) {
  if (index === 0) return true;
  const row = rows[index];
  const previous = rows[index - 1];
  if (key === 'setGuidance' && row.muscleGroup !== previous.muscleGroup) return true;
  return row[key] !== previous[key];
}

function getTrainingGroupRowSpan(rows, startIndex, key) {
  const row = rows[startIndex];
  let span = 1;
  for (let index = startIndex + 1; index < rows.length; index += 1) {
    const next = rows[index];
    if (next[key] !== row[key]) break;
    if (key === 'setGuidance' && next.muscleGroup !== row.muscleGroup) break;
    span += 1;
  }
  return span;
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

export default App;

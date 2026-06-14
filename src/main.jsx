import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import data from './data/generated/workbook.json';
import './styles.css';

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

const routeFromHash = () => (window.location.hash || '#/').replace('#/', '') || 'dashboard';
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

  const active = routes.find((item) => item.id === route) || routes[0];

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
        <section className="panel">
          <PanelTitle title={`${category}饮食路径`} subtitle="先选择训练发生的时间，再看力训日、休息日、输入项和原表说明。" />
          <Segmented items={plans} selectedId={selected?.id} onSelect={setSelectedId} getLabel={(item) => item.timing} />
        </section>
        {selected && (
          <section className="panel">
            <PanelTitle title={selected.title} subtitle={selected.summary || '原表没有额外摘要，建议直接查看餐次和原表行。'} />
            <SourcePills refs={selected.sourceRefs} />
            <GoalInputPlanner goal={goal} plan={selected} />
            <PanelTitle title="原表输入说明" subtitle="下面保留 Excel 中对输入项、调整规则和执行注意事项的原始说明。" />
            <div className="info-grid">
              {selected.inputs.map((item, index) => (
                <article className="info-tile" key={`${item.label}-${index}`}>
                  <b>{item.label}</b>
                  <span>{item.detail}</span>
                </article>
              ))}
            </div>
            <div className="split-grid">
              <MealList title="力训日饮食" rows={filterRows(selected.trainingDayMeals)} />
              <MealList title="休息日饮食" rows={filterRows(selected.restDayMeals)} />
            </div>
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

const activityOptions = [
  { value: 1.2, label: '久坐少动', detail: '几乎不运动' },
  { value: 1.375, label: '轻度活动', detail: '每周 1-3 练' },
  { value: 1.55, label: '中等活动', detail: '每周 3-5 练' },
  { value: 1.725, label: '高活动量', detail: '每周 5-6 练' },
];

const speedOptions = {
  'fat-loss': [
    { value: 300, label: '稳妥减脂', detail: '每日约 -300 kcal' },
    { value: 500, label: '标准减脂', detail: '每日约 -500 kcal' },
    { value: 700, label: '较快减脂', detail: '每日约 -700 kcal' },
  ],
  'muscle-gain': [
    { value: 150, label: '干净增肌', detail: '每日约 +150 kcal' },
    { value: 250, label: '标准增肌', detail: '每日约 +250 kcal' },
    { value: 350, label: '偏快增肌', detail: '每日约 +350 kcal' },
  ],
};

const defaultProfiles = {
  'fat-loss': { sex: 'male', height: '175', weight: '75', age: '28', activity: '1.55', delta: '500' },
  'muscle-gain': { sex: 'male', height: '175', weight: '65', age: '28', activity: '1.55', delta: '250' },
};

function GoalInputPlanner({ goal, plan }) {
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
  const metrics = useMemo(() => computeNutrition(goal, profile), [goal, profile]);
  const isFatLoss = goal === 'fat-loss';

  return (
    <div className="planner-panel">
      <div className="planner-head">
        <div>
          <p className="section-label">自己输入</p>
          <h3>{isFatLoss ? '减脂目标计算器' : '增肌目标计算器'}</h3>
          <p>{isFatLoss ? '根据身体数据估算维持热量，再给出减脂期目标热量和宏量营养素。' : '根据身体数据估算维持热量，再给出增肌期盈余热量和宏量营养素。'}</p>
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
        <Field label="活动水平">
          <select value={profile.activity} onChange={update('activity')}>
            {activityOptions.map((item) => <option value={item.value} key={item.value}>{item.label} · {item.detail}</option>)}
          </select>
        </Field>
        <Field label={isFatLoss ? '减脂速度' : '增肌速度'}>
          <select value={profile.delta} onChange={update('delta')}>
            {speedOptions[goal].map((item) => <option value={item.value} key={item.value}>{item.label} · {item.detail}</option>)}
          </select>
        </Field>
      </div>

      <div className="metric-strip">
        <Stat value={metrics.bmiText} label={`BMI · ${metrics.bmiLabel}`} />
        <Stat value={`${metrics.bmr} kcal`} label="基础代谢估算" />
        <Stat value={`${metrics.tdee} kcal`} label="维持热量估算" />
        <Stat value={`${metrics.targetCalories} kcal`} label={isFatLoss ? '减脂目标热量' : '增肌目标热量'} />
      </div>

      <div className="macro-grid">
        <article>
          <b>蛋白质</b>
          <strong>{metrics.protein} g/天</strong>
          <span>{isFatLoss ? '优先保肌，建议分配到每餐。' : '支持训练恢复和肌肉合成。'}</span>
        </article>
        <article>
          <b>脂肪</b>
          <strong>{metrics.fat} g/天</strong>
          <span>不要长期压得过低，优先保证基础摄入。</span>
        </article>
        <article>
          <b>碳水</b>
          <strong>{metrics.carbs} g/天</strong>
          <span>{isFatLoss ? '优先放在训练前后和主餐。' : '训练日前后可适当集中。'}</span>
        </article>
      </div>

      <div className="advice-box">
        <b>{isFatLoss ? '执行建议' : '增肌建议'}</b>
        <p>{metrics.advice}</p>
        <p>{metrics.targetWeightText}</p>
      </div>
    </div>
  );
}

function computeNutrition(goal, profile) {
  const sex = profile.sex === 'female' ? 'female' : 'male';
  const height = clampNumber(profile.height, 120, 230, 175);
  const weight = clampNumber(profile.weight, 35, 180, 70);
  const age = clampNumber(profile.age, 12, 80, 28);
  const activity = clampNumber(profile.activity, 1.2, 1.9, 1.55);
  const delta = clampNumber(profile.delta, 100, 900, goal === 'fat-loss' ? 500 : 250);
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161));
  const tdee = Math.round(bmr * activity);
  const minimumCalories = sex === 'male' ? 1500 : 1200;
  const rawTarget = goal === 'fat-loss' ? tdee - delta : tdee + delta;
  const targetCalories = Math.max(Math.round(rawTarget), minimumCalories);
  const proteinRate = goal === 'fat-loss' ? 1.8 : 1.7;
  const fatRate = goal === 'fat-loss' ? 0.75 : 0.9;
  const protein = Math.round(weight * proteinRate);
  const fat = Math.round(weight * fatRate);
  const carbs = Math.max(0, Math.round((targetCalories - protein * 4 - fat * 9) / 4));
  const bmiLabel = bmi < 18.5 ? '偏低' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
  const targetWeight = Math.round((goal === 'fat-loss' ? 22 : 23) * heightM * heightM);
  const advice = goal === 'fat-loss'
    ? `先按 ${targetCalories} kcal 执行 2 周，观察 7 日平均体重。若两周几乎不动，再减少 100-150 kcal 或增加有氧。`
    : `先按 ${targetCalories} kcal 执行 2-3 周，观察训练表现和腰围。若体重不上升，再增加 100-150 kcal。`;
  const targetWeightText = goal === 'fat-loss'
    ? `以 BMI 约 22 估算，阶段目标体重可先看 ${targetWeight} kg 附近，不必一次追到极低体重。`
    : `以 BMI 约 23 估算，长期体重上限可先参考 ${targetWeight} kg 附近，优先保证围度和力量质量。`;

  return {
    bmiText: Number.isFinite(bmi) ? bmi.toFixed(1) : '-',
    bmiLabel,
    bmr,
    tdee,
    targetCalories,
    protein,
    fat,
    carbs,
    advice,
    targetWeightText,
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
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
  const rate = Number.parseFloat(food?.rate);
  const grams = rate ? Math.round(Number(target || 0) / rate) : null;
  return (
    <div className="tool-grid">
      <Field label="选择食物"><select value={foodId} onChange={(event) => setFoodId(event.target.value)}>{data.foods.map((item) => <option key={item.id} value={item.id}>{item.macroType} · {item.name}</option>)}</select></Field>
      <Field label={`目标${food?.macroType || ''}克数`}><input value={target} onChange={(event) => setTarget(event.target.value)} /></Field>
      <div className="calc-result inline"><strong>{grams ? `${grams} g` : '无法换算'}</strong><span>{food?.name} · 营养率 {food?.rate} · {formatSources(food?.sourceRefs)}</span></div>
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
      {items.map((item) => (
        <details className="qa-item" key={item.id}>
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

createRoot(document.getElementById('root')).render(<App />);

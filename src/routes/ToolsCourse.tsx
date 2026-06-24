import * as React from 'react';
import { Empty, Field, PanelTitle } from '../components/ui/course-primitives';
import { useAppData } from '../lib/app-data';
import { convertFoodWeight } from '../features/foods/food-converter';
import { safeEval } from '../features/tools/safe-eval';
import type { CardioEntry, RouteConfig } from '../types';
import { ModuleRail, Table } from './shared';

export function ToolsCourseRoute({ routes }: { routes: RouteConfig[] }) {
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
      <ModuleRail moduleId="tools" routes={routes} />
    </div>
  );
}

export function CardioCalculator({ compact: isCompact = false }: { compact?: boolean }) {
  const data = useAppData();
  const cardioRows = data.cardio ?? [];
  const restOptions = [...new Set(cardioRows.map((item) => item.restingHeartRate))].filter(Boolean);
  const [rest, setRest] = React.useState(restOptions[0] || '60');
  const [heart, setHeart] = React.useState('120');
  const [weight, setWeight] = React.useState('70');
  const entry = cardioRows.find((item) => item.restingHeartRate === rest && item.exerciseHeartRate === heart) || cardioRows[0];
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
      {!isCompact && <CardioKcalTable rows={cardioRows} />}
    </section>
  );
}

function CardioKcalTable({ rows = [] }: { rows?: CardioEntry[] }) {
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
              {shouldRenderGroupCell(rows, index, 'restingHeartRate') && (
                <td rowSpan={getGroupRowSpan(rows, index, 'restingHeartRate')} className="training-group-cell">
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

export function OneRepMaxCalculator({ compact: isCompact = false }: { compact?: boolean }) {
  const data = useAppData();
  const [weight, setWeight] = React.useState('50');
  const [reps, setReps] = React.useState('10');
  const w = Number(weight || 0);
  const r = Number(reps || 0);
  const results = (data.oneRepMax ?? []).map((row) => ({ ...row, value: safeEval(row.expression, w, r) }));
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
  const foods = data.foods ?? [];
  const [foodId, setFoodId] = React.useState(foods[0]?.id);
  const [target, setTarget] = React.useState('50');
  const food = foods.find((item) => item.id === foodId) || foods[0];
  const amount = convertFoodWeight(Number(target || 0), food);

  return (
    <div className="tool-grid">
      <Field label="选择食物"><select value={foodId} onChange={(event) => setFoodId(event.target.value)}>{foods.map((item) => <option key={item.id} value={item.id}>{item.macroType} · {item.name}</option>)}</select></Field>
      <Field label={`目标${food?.macroType || ''}克数`}><input value={target} onChange={(event) => setTarget(event.target.value)} /></Field>
      <div className="calc-result inline"><strong>{amount ? `${amount.value} ${amount.unit}` : '无法换算'}</strong><span>{food?.name} · 营养率 {food?.rate}</span></div>
    </div>
  );
}

function shouldRenderGroupCell(rows: CardioEntry[], index: number, key: keyof CardioEntry) {
  if (index === 0) return true;
  return rows[index][key] !== rows[index - 1][key];
}

function getGroupRowSpan(rows: CardioEntry[], startIndex: number, key: keyof CardioEntry) {
  const row = rows[startIndex];
  let span = 1;
  for (let index = startIndex + 1; index < rows.length; index += 1) {
    if (rows[index][key] !== row[key]) break;
    span += 1;
  }
  return span;
}

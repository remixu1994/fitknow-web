import * as React from 'react';
import { Empty, PanelTitle } from '../components/ui/course-primitives';
import { useAppData } from '../lib/app-data';
import { matches } from '../lib/search';
import type { RouteConfig, TrainingInfo, TrainingPlan, TrainingRow } from '../types';
import { ModuleRail } from './shared';

export function TrainingCourseRoute({ query, routes }: { query: string; routes: RouteConfig[] }) {
  const data = useAppData();
  const trainingPlans = data.trainingPlans ?? [];
  const [planId, setPlanId] = React.useState(trainingPlans[0]?.id);
  const [dayFilter, setDayFilter] = React.useState('全部');
  const plan = trainingPlans.find((item) => item.id === planId) || trainingPlans[0];

  if (!plan) return <Empty text="训练数据暂不可用。" />;

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
          <Segmented items={trainingPlans} selectedId={plan.id} onSelect={setPlanId} getLabel={(item) => item.title} />
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
      <ModuleRail moduleId="training" routes={routes} />
    </div>
  );
}

function TrainingInfoTable({ items = [] }: { items?: TrainingInfo[] }) {
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

function TrainingDayTable({ day }: { day: TrainingPlan['days'][number] & { introRow?: TrainingRow | null; exerciseRows?: TrainingRow[] } }) {
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

function Segmented<T extends { id: string }>({ items, selectedId, onSelect, getLabel }: { items: T[]; selectedId?: string; onSelect: (id: string) => void; getLabel: (item: T) => string }) {
  return (
    <div className="segmented">
      {items.map((item) => <button key={item.id} className={item.id === selectedId ? 'selected' : ''} onClick={() => onSelect(item.id)}>{getLabel(item)}</button>)}
    </div>
  );
}

function isTrainingDayIntroRow(row?: TrainingRow | null) {
  return row && !row.setGuidance && !row.exercise;
}

function getTrainingDayIntroRow(rows: TrainingRow[] = []): TrainingRow | null {
  return isTrainingDayIntroRow(rows[0]) ? rows[0] : null;
}

function getTrainingExerciseRows(rows: TrainingRow[] = []): TrainingRow[] {
  return getTrainingDayIntroRow(rows) ? rows.slice(1) : rows;
}

function hydrateTrainingRows(rows: TrainingRow[] = [], title = ''): TrainingRow[] {
  let currentMuscleGroup = getTrainingDefaultMuscleGroup(title);
  return rows.map((row) => {
    currentMuscleGroup = row.muscleGroup || currentMuscleGroup;
    return { ...row, muscleGroup: currentMuscleGroup };
  });
}

function getTrainingDefaultMuscleGroup(title = '') {
  return title.replace(/^Day\d+[：:]\s*/, '').split('+')[0]?.trim() || '';
}

function getTrainingPrimaryJointLabel(day: TrainingPlan['days'][number] & { introRow?: TrainingRow | null }) {
  const introLabel = day.introRow?.shoulderJoint;
  if (introLabel?.includes('关节')) return introLabel;
  if (day.title?.includes('腿') || day.title?.includes('臀')) return '膝关节';
  return '肩关节';
}

function shouldRenderTrainingGroupCell(rows: TrainingRow[], index: number, key: keyof TrainingRow) {
  if (index === 0) return true;
  const row = rows[index];
  const previous = rows[index - 1];
  if (key === 'setGuidance' && row.muscleGroup !== previous.muscleGroup) return true;
  return row[key] !== previous[key];
}

function getTrainingGroupRowSpan(rows: TrainingRow[], startIndex: number, key: keyof TrainingRow) {
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

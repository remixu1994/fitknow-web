import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toPng } from 'html-to-image';
import ExportCard from '../components/ExportCard';
import { Empty, Field, PanelTitle, Stat } from '../components/ui/course-primitives';
import { useAppData } from '../lib/app-data';
import { deleteCalorieRecord, getCalorieRecords, upsertCalorieRecord, type DailyCalorieRecordInput } from '../lib/calorie-store';
import { matches } from '../lib/search';
import {
  computeMealTargets,
  computeNutrition,
  dayLabel,
  defaultProfiles,
  isNoStrengthPlan,
  targetCaloriesForTable,
} from '../features/nutrition/nutrition-calculator';
import {
  computeFoodMacro,
  findDefaultFood,
  findFoodByQuery,
  foodInputUnit,
  foodOptionLabel,
  reverseFoodAmount,
  suggestedFoodAmount,
  suggestedMacroAmount,
} from '../features/foods/food-converter';
import type { DailyCalorieDayType, DailyCalorieRecord, DietPlan, Food, MealRow, NutritionMetrics, Profile, RouteConfig } from '../types';
import { ModuleRail, QaList } from './shared';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function DietCourseRoute({ goal, query, routes }: { goal: DietPlan['goal']; query: string; routes: RouteConfig[] }) {
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
  const filterRows = (rows: MealRow[] = []) => rows.filter((row) => matches(row, query)).slice(0, 60);
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
      <ModuleRail moduleId={goal} routes={routes} />
    </div>
  );
}

function GoalInputPlanner({ goal, plan, query = '', topSelector = null, pathSelector = null }: { goal: DietPlan['goal']; plan: DietPlan; query?: string; topSelector?: ReactNode; pathSelector?: ReactNode }) {
  const storageKey = `fitknow-${goal}-profile`;
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      return { ...defaultProfiles[goal], ...JSON.parse(localStorage.getItem(storageKey) || '{}') };
    } catch {
      return defaultProfiles[goal];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(profile));
  }, [profile, storageKey]);

  const update = (field: keyof Profile) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setProfile((current) => ({ ...current, [field]: event.target.value }));
  const metrics = useMemo(() => computeNutrition(goal, profile, plan) as NutritionMetrics, [goal, profile, plan]);
  const isFatLoss = goal === 'fat-loss';
  const isNoStrength = isFatLoss && isNoStrengthPlan(plan);
  const category = isFatLoss ? '减脂' : '增肌';

  const [exportOpen, setExportOpen] = useState(false);
  const [exportPlatform, setExportPlatform] = useState<'wechat' | 'douyin' | 'xiaohongshu' | null>(null);
  const exportCardRef = useRef<HTMLDivElement | null>(null);

  const handleExport = async (platform: 'wechat' | 'douyin' | 'xiaohongshu') => {
    setExportPlatform(platform);
    setExportOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 120));
    if (exportCardRef.current) {
      const dataUrl = await toPng(exportCardRef.current, { pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `fitknow-fat-loss-${platform}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
    setExportPlatform(null);
  };

  return (
    <div className="planner-panel">
      <div className="planner-head">
        <div>
          <p className="section-label">自己输入</p>
          <h3>{category}目标计算器</h3>
          <p>{isFatLoss ? '估算无运动总消耗、力训/休息日平衡热量和应吃热量，再结合配额表拆到每餐。' : '估算无运动总消耗、力训/休息日平衡热量和应吃热量，再结合增肌配额拆到每餐。'}</p>
        </div>
        {isFatLoss && (
          <div className="export-controls">
            <button className="export-btn" onClick={() => setExportOpen((v) => !v)}>
              导出图片
            </button>
            {exportOpen && (
              <div className="export-dropdown">
                <button onClick={() => handleExport('wechat')}>微信分享图 (9:16)</button>
                <button onClick={() => handleExport('douyin')}>抖音封面图 (9:16)</button>
                <button onClick={() => handleExport('xiaohongshu')}>小红书 (3:4)</button>
              </div>
            )}
          </div>
        )}
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
      {exportPlatform && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={exportCardRef}>
            <ExportCard profile={profile} metrics={metrics} plan={plan} platform={exportPlatform} />
          </div>
        </div>
      )}
    </div>
  );
}

const BODY_FAT_KCAL_PER_KG = 7700;

function CalorieDeficitTracker({ metrics, noStrength }: { metrics: NutritionMetrics; noStrength: boolean }) {
  const [records, setRecords] = useState<DailyCalorieRecord[]>([]);
  const [date, setDate] = useState(() => getLocalDateString());
  const [intakeCalories, setIntakeCalories] = useState('');
  const [dayType, setDayType] = useState<DailyCalorieDayType>(noStrength ? 'daily' : 'training');
  const [editingDate, setEditingDate] = useState('');
  const [editingIntakeCalories, setEditingIntakeCalories] = useState('');
  const [editingDayType, setEditingDayType] = useState<DailyCalorieDayType>(noStrength ? 'daily' : 'training');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;

    getCalorieRecords().then((loadedRecords) => {
      if (active) setRecords(loadedRecords);
    }).catch((storageError) => {
      console.error('Failed to load calorie records', storageError);
      if (active) setError(getErrorMessage(storageError, '读取本地热量记录失败。'));
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      setError(getErrorMessage(storageError, '保存本地热量记录失败。'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (record: DailyCalorieRecord) => {
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

  const handleSaveInlineEdit = async (record: DailyCalorieRecord) => {
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
      setError(getErrorMessage(storageError, '保存本地热量记录失败。'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (recordDate: string) => {
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
      setError(getErrorMessage(storageError, '删除本地热量记录失败。'));
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

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      const savedRecords: DailyCalorieRecord[] = [];
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
      setError(getErrorMessage(importError, '导入失败，请检查文件格式。'));
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
          <select value={normalizedDayType} onChange={(event) => setDayType(event.target.value as DailyCalorieDayType)} disabled={noStrength}>
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
                          <select value={normalizedEditingDayType} onChange={(event) => setEditingDayType(event.target.value as DailyCalorieDayType)} disabled={noStrength}>
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

function parseImportedCalorieRecords(text: string, metrics: NutritionMetrics, noStrength: boolean): DailyCalorieRecordInput[] {
  const rows = parseImportedRows(text);

  return rows.map((row) => normalizeImportedCalorieRecord(row, metrics, noStrength)).filter((row): row is DailyCalorieRecordInput => Boolean(row));
}

function parseImportedRows(text: string): Record<string, string>[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed as Record<string, string>[];
    if (Array.isArray(parsed.records)) return parsed.records as Record<string, string>[];
    if (Array.isArray(parsed.dailyCalorieRecords)) return parsed.dailyCalorieRecords as Record<string, string>[];
    return [];
  }

  if (/<table[\s>]/i.test(trimmed)) {
    return tableRowsToObjects(parseHtmlTableRows(trimmed));
  }

  const delimiter = trimmed.includes('\t') ? '\t' : ',';
  return tableRowsToObjects(parseDelimitedRows(trimmed, delimiter));
}

function parseHtmlTableRows(html: string): string[][] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(document.querySelectorAll('tr')).map((row) => (
    Array.from(row.querySelectorAll('th,td')).map((cell) => cell.textContent?.trim() || '')
  )).filter((row) => row.some(Boolean));
}

function parseDelimitedRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
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

function tableRowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => normalizeImportHeader(header));

  return rows.slice(1).map((row) => headers.reduce((object, header, index) => {
    if (header) object[header] = row[index] ?? '';
    return object;
  }, {}));
}

function normalizeImportedCalorieRecord(row: Record<string, string>, metrics: NutritionMetrics, noStrength: boolean): DailyCalorieRecordInput | null {
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

function readImportField(row: Record<string, string>, keys: string[]): string {
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

function StructuredMealTables({ plan, metrics, query }: { plan: DietPlan; metrics: NutritionMetrics; query: string }) {
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
        <span className="meal-card-state">{isOpen ? '已展开' : '展开添加'}</span>
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

function MealFoodCell({ macroType, target, options, disabled = false }: { macroType: string; target?: number; options?: string[]; disabled?: boolean }) {
  const data = useAppData();
  const foods = useMemo(() => (data.foods ?? []).filter((food) => food.macroType === macroType), [data.foods, macroType]);
  const defaultFood = useMemo(() => findDefaultFood(options, macroType, foods), [options, macroType, foods]);
  const listId = useMemo(() => `foods-${macroType}-${Math.random().toString(36).slice(2)}`, [macroType]);
  const makeEntry = (food = defaultFood || foods[0], amount = suggestedFoodAmount(target, food), macro = typeof target === 'number' ? String(Math.round(target)) : suggestedMacroAmount(amount, food)) => ({
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
  const [entries, setEntries] = useState<Array<{ id: string; foodId: string; foodQuery: string; amount: string; macro: string }>>(() => [makeEntry()]);

  useEffect(() => {
    setEntries([makeEntry()]);
  }, [defaultFood?.id, target, foods]);

  const updateEntry = (id: string, patch: Partial<{ foodId: string; foodQuery: string; amount: string; macro: string }>) => {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };
  const addEntry = () => setEntries((current) => [...current, makeBlankEntry()]);
  const removeEntry = (id: string) => setEntries((current) => current.length > 1 ? current.filter((entry) => entry.id !== id) : current);
  const applyFoodQuery = (entry: { id: string; foodId: string; foodQuery: string; amount: string; macro: string }, query: string, fuzzy = false) => {
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
  const applyAmount = (entry: { id: string; foodId: string; foodQuery: string; amount: string; macro: string }, value: string, food?: Food) => {
    updateEntry(entry.id, { amount: value, macro: suggestedMacroAmount(value, food) });
  };
  const applyMacro = (entry: { id: string; foodId: string; foodQuery: string; amount: string; macro: string }, value: string, food?: Food) => {
    updateEntry(entry.id, { macro: value, amount: reverseFoodAmount(value, food) });
  };
  const actualTotal = entries.reduce((sum, entry) => {
    const food = foods.find((item) => item.id === entry.foodId);
    return sum + computeFoodMacro(entry.amount, food);
  }, 0);
  const hasTarget = typeof target === 'number' && Number.isFinite(target);
  const numericTarget = hasTarget ? target : null;
  const gap = numericTarget === null ? null : numericTarget - actualTotal;
  let gapText = "等待填写食物";
  if (numericTarget !== null) {
    const delta = numericTarget - actualTotal;
    gapText = Math.abs(delta) < 0.5
      ? "刚好达标"
      : delta > 0
        ? `还差约 ${Math.round(delta)} g`
        : `超出约 ${Math.round(Math.abs(delta))} g`;
  }
  return (
    <div className="meal-food-cell">
      <b>{macroType}{!disabled && numericTarget !== null ? ` · 目标约 ${Math.round(numericTarget)} g` : ''}</b>
      <strong>{disabled ? '暂无目标' : numericTarget !== null ? `${Math.round(actualTotal)} g` : '等待填写食物'}</strong>
      {!disabled && (
        <>
          <span className={gap !== null && gap < -0.5 ? 'macro-gap over' : 'macro-gap'}>{gapText}</span>
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
      {(options?.length ?? 0) > 0 && <small>{(options ?? []).slice(0, 2).join('、')}</small>}
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

function MealList({ title, rows = [] }: { title: string; rows?: MealRow[] }) {
  return (
    <div className="sub-panel">
      <h3>{title}</h3>
      <div className="meal-list">
        {rows.map((row) => <p key={row.row}><span>第 {row.row} 行</span>{row.text}</p>)}
        {!rows.length && <Empty text="暂无餐次内容" />}
      </div>
    </div>
  );
}

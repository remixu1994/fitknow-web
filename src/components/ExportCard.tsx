// ExportCard.tsx — shareable image for WeChat / Douyin / Xiaohongshu
import type { DietPlan, NutritionMetrics, Profile } from '../types';

type ExportPlatform = 'wechat' | 'douyin' | 'xiaohongshu';

interface ExportCardProps {
  profile: Profile;
  metrics: NutritionMetrics;
  plan: DietPlan;
  platform: ExportPlatform;
}

export default function ExportCard({ profile, metrics, plan, platform }: ExportCardProps) {
  const isNoStrength = plan?.title?.includes('无力训者');
  const quota = metrics.quotaMatch;
  const weight = Number(profile.weight) || 0;

  // Calculate macro grams
  const trainingCarbGrams = quota
    ? Math.round((quota.trainingCarb || 0) * weight)
    : metrics.trainingCarbs || 0;
  const restCarbGrams = quota
    ? Math.round((quota.restCarb || 0) * weight)
    : metrics.restCarbs || 0;
  const dailyCarbGrams = quota
    ? Math.round((quota.dailyCarb || 0) * weight)
    : metrics.carbs || 0;
  const proteinGrams = quota
    ? Math.round(quota.protein * weight)
    : metrics.trainingProtein || metrics.protein || 0;

  const carbGrams = isNoStrength ? dailyCarbGrams : trainingCarbGrams;
  const totalCalories = isNoStrength
    ? (metrics.targetCalories || 0)
    : (metrics.trainingTargetCalories || 0);

  // Fat = (totalCalories - carbs*4 - protein*4) / 9
  const fatGrams = Math.max(0, Math.round((totalCalories - carbGrams * 4 - proteinGrams * 4) / 9));

  const platformClass = `platform-${platform}`;
  const platformLabel = platform === 'wechat' ? '微信分享' : platform === 'douyin' ? '抖音封面' : '小红书';

  return (
    <div className={`export-card ${platformClass}`}>
      {/* Brand header */}
      <div className="export-card-header">
        <div className="export-card-brand">
          <span className="export-card-logo">FitKnow</span>
          <span className="export-card-tag">减脂计划</span>
        </div>
        <span className="export-card-platform">{platformLabel}</span>
      </div>

      {/* User data */}
      <div className="export-card-section">
        <p className="export-card-section-title">用户数据</p>
        <div className="export-card-user-grid">
          <div className="export-card-stat">
            <strong>{profile.height}</strong>
            <span>身高 cm</span>
          </div>
          <div className="export-card-stat">
            <strong>{profile.weight}</strong>
            <span>体重 kg</span>
          </div>
          <div className="export-card-stat">
            <strong>{profile.age}</strong>
            <span>年龄</span>
          </div>
          <div className="export-card-stat">
            <strong>{profile.sex === 'female' ? '女' : '男'}</strong>
            <span>性别</span>
          </div>
        </div>
      </div>

      {/* Calculation results */}
      <div className="export-card-section">
        <p className="export-card-section-title">计算结果</p>
        <div className="export-card-results-grid">
          <div className="export-card-result-item">
            <span className="export-card-result-label">基础代谢 (BMR)</span>
            <strong className="export-card-result-value">{metrics.bmr} kcal</strong>
          </div>
          <div className="export-card-result-item">
            <span className="export-card-result-label">无运动总消耗 (TDEE)</span>
            <strong className="export-card-result-value">{metrics.restingExpenditure} kcal</strong>
          </div>
          {isNoStrength ? (
            <div className="export-card-result-item wide">
              <span className="export-card-result-label">每日应吃热量</span>
              <strong className="export-card-result-value">{metrics.targetCalories} kcal</strong>
            </div>
          ) : (
            <>
              <div className="export-card-result-item">
                <span className="export-card-result-label">训练日应吃热量</span>
                <strong className="export-card-result-value">{metrics.trainingTargetCalories} kcal</strong>
              </div>
              <div className="export-card-result-item">
                <span className="export-card-result-label">休息日应吃热量</span>
                <strong className="export-card-result-value">{metrics.restTargetCalories} kcal</strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Macronutrients */}
      <div className="export-card-section">
        <p className="export-card-section-title">宏量营养素</p>
        <div className="export-card-macro-grid">
          <div className="export-card-macro-item">
            <span className="export-card-macro-label">碳水化合物</span>
            <strong className="export-card-macro-value">{carbGrams} g</strong>
          </div>
          <div className="export-card-macro-item">
            <span className="export-card-macro-label">蛋白质</span>
            <strong className="export-card-macro-value">{proteinGrams} g</strong>
          </div>
          <div className="export-card-macro-item">
            <span className="export-card-macro-label">脂肪</span>
            <strong className="export-card-macro-value">{fatGrams} g</strong>
          </div>
        </div>
      </div>

      {/* Goal */}
      <div className="export-card-section">
        <p className="export-card-section-title">目标建议</p>
        <div className="export-card-goal">
          <p>{metrics.targetWeightText}</p>
          <p className="export-card-deficit">
            建议每日热量缺口约 {Math.round((metrics.maintenanceCalories || metrics.restingExpenditure || 0) - totalCalories)} kcal
          </p>
        </div>
      </div>

      {/* Brand footer */}
      <div className="export-card-footer">
        <span>fitknow.remixu1994.github.io</span>
      </div>
    </div>
  );
}

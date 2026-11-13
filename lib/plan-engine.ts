import {
  activityLabels,
  buildDietPlan,
  buildGoalLine,
  buildMovementPlan,
  buildSpaceTargets,
  dietLabels,
  environmentLabels,
  goalLabels,
  spaceCompleteness,
  type DietSlot,
  type SpaceProfile,
  type SpaceTargets,
} from "./space";

export const PLAN_SCHEMA_VERSION = 1;
export const PLAN_ENGINE_VERSION = "2026-11.1";
export const PLAN_ENGINE_NAME = "智养规则引擎";

export type PlanMeal = DietSlot & { kcalHint: string | null };

export type PlanSafety = {
  flags: string[];
  disclaimer: string;
};

export type PlanDataBasis = {
  source: "demo" | "local";
  usedFields: string[];
  missingFields: string[];
  usesMealRecords: false;
  targetMethod: string | null;
  notes: string[];
};

export type PlanProfileSnapshot = {
  name: string;
  goal: string;
  goalLabel: string;
  activityLabel: string;
  environmentLabel: string;
  dietLabel: string;
  age: string;
  gender: string;
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  avoid: string;
  budget: string;
};

export type PlanDocument = {
  schemaVersion: number;
  engineVersion: string;
  engineName: string;
  version: number;
  generatedAt: string;
  fingerprint: string;
  profileSnapshot: PlanProfileSnapshot;
  completeness: { filled: number; total: number; missing: string[] };
  dataBasis: PlanDataBasis;
  targets: SpaceTargets | null;
  targetsReason: string | null;
  goalLine: string | null;
  diet: {
    meals: PlanMeal[];
    avoidNote: string;
    budgetNote: string;
    energySplitNote: string | null;
  };
  movement: ReturnType<typeof buildMovementPlan>;
  safety: PlanSafety;
};

function num(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const fingerprintFields = [
  "name",
  "gender",
  "age",
  "heightCm",
  "weightKg",
  "targetWeightKg",
  "goal",
  "activity",
  "days",
  "minutes",
  "environment",
  "diet",
  "avoid",
  "budget",
] as const;

export function planFingerprint(profile: SpaceProfile) {
  const basis = fingerprintFields.map((key) => String(profile[key] ?? "").trim()).join("|");
  let hash = 2166136261;
  for (let index = 0; index < basis.length; index += 1) {
    hash ^= basis.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `p${(hash >>> 0).toString(36)}`;
}

function buildMealHints(meals: DietSlot[], targets: SpaceTargets | null): PlanMeal[] {
  if (!targets) return meals.map((meal) => ({ ...meal, kcalHint: null }));
  const split = [0.25, 0.35, 0.1, 0.3];
  return meals.map((meal, index) => {
    const ratio = split[index] ?? 1 / meals.length;
    const low = Math.round((targets.calorieLow * ratio) / 10) * 10;
    const high = Math.round((targets.calorieHigh * ratio) / 10) * 10;
    return { ...meal, kcalHint: `约 ${low}–${high} kcal` };
  });
}

function buildSafety(profile: SpaceProfile, targets: SpaceTargets | null, targetsReason: string | null) {
  const flags = [
    "运动以无痛范围为限；胸痛、眩晕、异常气促或心悸时立即停止，必要时就医。",
    "如有慢性病、孕期、饮食障碍史或正在调整用药，先咨询医生或注册营养师。",
  ];
  const weight = num(profile.weightKg);
  const targetWeight = num(profile.targetWeightKg);
  const avoid = profile.avoid.trim();
  const budget = num(profile.budget);

  if (!targets && targetsReason) flags.push(targetsReason);
  if (avoid) flags.push(`已记录忌口：${avoid}。计划不会逐项核对加工食品配料表，购买前仍需确认。`);
  if (profile.diet === "vegetarian") flags.push("素食结构需要留意蛋白质、铁和维生素 B12；长期素食建议咨询营养师。");
  if (budget !== null) flags.push(`预算约 ¥${budget}/天，只作为采购和外食的参考，不代表营养保证。`);
  if (weight !== null && targetWeight !== null && weight > 0) {
    const change = Math.abs(targetWeight - weight) / weight;
    if (change > 0.1) flags.push("目标体重与当前体重差距超过 10%，建议拆成阶段目标，并和专业人士确认节奏。");
  }
  if (targets && targets.bmi < 18.5 && (profile.goal === "lose" || (weight !== null && targetWeight !== null && targetWeight < weight))) {
    flags.push("按填写的身高体重计算，BMI 低于 18.5 的常见范围，不建议继续减脂；请先咨询医生或营养师。");
  }
  if (profile.goal === "lose") flags.push("热量参考设置了 1400 kcal 下限；下限不等于适合所有人，长期低于需求需要专业评估。");

  return {
    flags,
    disclaimer: "本计划由固定规则按你填写的资料生成，不读取餐食记录、体重趋势或手环数据，也不构成医疗诊断、营养处方或效果承诺。",
  };
}

function buildDataBasis(profile: SpaceProfile, targets: SpaceTargets | null): PlanDataBasis {
  const completeness = spaceCompleteness(profile);
  const usedFields: string[] = ["称呼", "健康目标", "活动水平", "每周次数", "每次时长", "训练环境", "饮食偏好"];
  if (profile.gender !== "unspecified") usedFields.unshift("性别");
  if (profile.age.trim()) usedFields.push("年龄");
  if (profile.heightCm.trim()) usedFields.push("身高");
  if (profile.weightKg.trim()) usedFields.push("体重");
  if (profile.targetWeightKg.trim()) usedFields.push("目标体重");
  if (profile.avoid.trim()) usedFields.push("忌口");
  if (profile.budget.trim()) usedFields.push("预算");

  return {
    source: profile.source,
    usedFields,
    missingFields: completeness.missing,
    usesMealRecords: false,
    targetMethod: targets ? "Mifflin-St Jeor 公式 + 活动系数 + 目标偏移，热量下限 1400 kcal" : null,
    notes: [
      "只使用资料页填写的信息；没有读取今日餐食、体重记录或运动手环。",
      "热量与蛋白质是区间参考，不是精确消耗或处方；实际需求会随身体状况变化。",
      "餐次结构和替换建议来自固定模板，会按饮食偏好与训练环境选择。",
    ],
  };
}

export function buildPlan(profile: SpaceProfile, version = 1, now = new Date()): PlanDocument {
  const targetResult = buildSpaceTargets(profile);
  const diet = buildDietPlan(profile);
  const movement = buildMovementPlan(profile);
  const completeness = spaceCompleteness(profile);
  const targets = targetResult.targets;

  return {
    schemaVersion: PLAN_SCHEMA_VERSION,
    engineVersion: PLAN_ENGINE_VERSION,
    engineName: PLAN_ENGINE_NAME,
    version,
    generatedAt: now.toISOString(),
    fingerprint: planFingerprint(profile),
    profileSnapshot: {
      name: profile.name,
      goal: profile.goal,
      goalLabel: goalLabels[profile.goal],
      activityLabel: activityLabels[profile.activity],
      environmentLabel: environmentLabels[profile.environment],
      dietLabel: dietLabels[profile.diet],
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      targetWeightKg: profile.targetWeightKg,
      avoid: profile.avoid,
      budget: profile.budget,
    },
    completeness,
    dataBasis: buildDataBasis(profile, targets),
    targets,
    targetsReason: targetResult.reason,
    goalLine: buildGoalLine(profile),
    diet: {
      meals: buildMealHints(diet.meals, targets),
      avoidNote: diet.avoidNote,
      budgetNote: diet.budgetNote,
      energySplitNote: targets
        ? "每餐热量按早餐 25%、午餐 35%、加餐 10%、晚餐 30% 粗略分配，只用于安排结构，不需要精确到每一口。"
        : null,
    },
    movement,
    safety: buildSafety(profile, targets, targetResult.reason),
  };
}
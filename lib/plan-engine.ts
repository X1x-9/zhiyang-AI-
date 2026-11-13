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
import type { PlanMealSummary } from "./plan-context";

export const PLAN_SCHEMA_VERSION = 2;
export const PLAN_ENGINE_VERSION = "2026-11.2";
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
  usesMealRecords: boolean;
  mealRecordCount: number;
  mealRecordedDays: number;
  mealMacroCompleteMeals: number;
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

export type PlanFocus = "none" | "protein_focus" | "portion_focus";
export type PlanAgentStatus = "OK" | "SKIPPED" | "FAILED";
export type PlanRagStatus = "OK" | "NO_MATCH" | "NOT_CONFIGURED" | "RETRIEVAL_FAILED" | "NOT_CALLED";

export type PlanAgentReference = {
  title: string;
  source: string;
  similarity: number;
};

export type PlanAgentToolLog = {
  name: string;
  status: "OK" | "REJECTED" | "ERROR";
  summary: string;
};

export type PlanAgentAdjustment = {
  area: string;
  from: string;
  to: string;
  reason: string;
};

export type PlanInputSummary = {
  profileFields: string[];
  confirmedMeals: number;
  recordedDays: number;
  macroCompleteMeals: number;
  completeDays: number;
  mealWindowDays: number;
  currentPlanVersion: number | null;
};

export type PlanAgentMeta = {
  status: PlanAgentStatus;
  model: string | null;
  fallbackReason: string | null;
  inputSummary: PlanInputSummary;
  toolLog: PlanAgentToolLog[];
  rationale: string[];
  adjustments: PlanAgentAdjustment[];
  references: PlanAgentReference[];
  ragStatus: PlanRagStatus;
};

export type PlanVersionSummary = {
  version: number;
  createdAt: string;
  active: boolean;
  isLatest: boolean;
  basedOnVersion: number | null;
  summary: string;
  inputSummary: PlanInputSummary | null;
};

export type PlanAgentDraft = {
  status: PlanAgentStatus;
  model: string | null;
  fallbackReason: string | null;
  focus: PlanFocus;
  focusNote: string | null;
  rationale: string[];
  adjustments: PlanAgentAdjustment[];
  references: PlanAgentReference[];
  toolLog: PlanAgentToolLog[];
  ragStatus: PlanRagStatus;
};

export type PlanCoaching = {
  focus: PlanFocus;
  focusLabel: string;
  focusNote: string;
  notes: string[];
};

export type PlanRevision = {
  basedOnVersion: number | null;
  changes: Array<{ area: string; before: string; after: string }>;
  summary: string;
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
  coaching?: PlanCoaching;
  agent?: PlanAgentMeta | null;
  revision?: PlanRevision;
};

export type PlanBuildOptions = {
  mealSummary?: PlanMealSummary | null;
  agent?: PlanAgentDraft | null;
  previousPlan?: PlanDocument | null;
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

function buildSafety(profile: SpaceProfile, targets: SpaceTargets | null, targetsReason: string | null, mealSummary?: PlanMealSummary | null) {
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
  if (mealSummary && mealSummary.recordCount > 0 && mealSummary.macroCompleteMeals < mealSummary.recordCount) {
    flags.push(`近 ${mealSummary.windowDays} 天有 ${mealSummary.recordCount - mealSummary.macroCompleteMeals} 餐缺少完整蛋白质、碳水或脂肪字段；缺失不等于没吃，也不据此判断摄入是否达标。`);
  }

  return {
    flags,
    disclaimer: "本计划由固定规则生成；AI 建议只在受约束范围内选择建议重点并解释，不计算营养数值。计划不构成医疗诊断、营养处方或效果承诺，也不替代医生或注册营养师。",
  };
}

function usedProfileFields(profile: SpaceProfile) {
  const usedFields: string[] = ["称呼", "健康目标", "活动水平", "每周次数", "每次时长", "训练环境", "饮食偏好"];
  if (profile.gender !== "unspecified") usedFields.unshift("性别");
  if (profile.age.trim()) usedFields.push("年龄");
  if (profile.heightCm.trim()) usedFields.push("身高");
  if (profile.weightKg.trim()) usedFields.push("体重");
  if (profile.targetWeightKg.trim()) usedFields.push("目标体重");
  if (profile.avoid.trim()) usedFields.push("忌口");
  if (profile.budget.trim()) usedFields.push("预算");
  return usedFields;
}

function buildDataBasis(profile: SpaceProfile, targets: SpaceTargets | null, mealSummary?: PlanMealSummary | null, agent?: PlanAgentDraft | null): PlanDataBasis {
  const completeness = spaceCompleteness(profile);
  const usedFields = usedProfileFields(profile);
  if (mealSummary?.recordCount) usedFields.push("近 7 天已确认餐食");

  const notes: string[] = [];
  if (!mealSummary?.recordCount) {
    notes.push("近 7 天没有读到已确认餐食；本次只按资料生成，不推断你的饮食情况，也不把缺失记录当成没吃。");
  } else {
    notes.push(`读取了 ${mealSummary.recordCount} 餐已确认记录，覆盖 ${mealSummary.recordedDays} 天；其中 ${mealSummary.macroCompleteMeals} 餐含完整蛋白质、碳水与脂肪字段。`);
    if (mealSummary.macroCompleteMeals < mealSummary.recordCount) {
      notes.push("缺少营养字段的餐食不进入宏量营养素汇总；缺失只代表记录不完整，不代表实际摄入。");
    }
    if (mealSummary.completeDayCount < 2) {
      notes.push("记录较完整的天数不足 2 天，本次不根据单日数据调整计划。");
    }
  }
  notes.push("热量与蛋白质是区间参考，不是精确消耗或处方；实际需求会随身体状况变化。");
  notes.push("餐次结构和替换建议来自固定模板，会按饮食偏好与训练环境选择。");
  if (agent?.status === "OK") {
    notes.push("AI 只选择受约束的建议重点并解释；热量计算、营养汇总和安全边界由确定性规则完成。");
  } else if (agent) {
    notes.push("本次 AI 建议未完成，计划仍按确定性规则生成；不会用模型编造数据补齐。");
  }

  return {
    source: profile.source,
    usedFields,
    missingFields: completeness.missing,
    usesMealRecords: Boolean(mealSummary?.recordCount),
    mealRecordCount: mealSummary?.recordCount ?? 0,
    mealRecordedDays: mealSummary?.recordedDays ?? 0,
    mealMacroCompleteMeals: mealSummary?.macroCompleteMeals ?? 0,
    targetMethod: targets ? "Mifflin-St Jeor 公式 + 活动系数 + 目标偏移，热量下限 1400 kcal" : null,
    notes,
  };
}

const focusLabels: Record<PlanFocus, string> = {
  none: "无针对性调整",
  protein_focus: "蛋白质重点",
  portion_focus: "份量重点",
};

function buildCoaching(mealSummary?: PlanMealSummary | null, agent?: PlanAgentDraft | null): PlanCoaching {
  const focus = agent?.focus ?? "none";
  let focusNote = agent?.focusNote?.trim() || "";
  if (!focusNote) {
    if (!mealSummary?.recordCount) {
      focusNote = "近 7 天没有已确认餐食，本次只按资料生成结构，不推断你的饮食情况。";
    } else if (mealSummary.completeDayCount < 2) {
      focusNote = "记录较完整的天数不足 2 天，本次不根据单日记录调整计划，保持资料生成的结构。";
    } else {
      focusNote = "已确认餐食中没有触发可安全执行的调整条件，本次保持资料生成的结构。";
    }
  }
  return {
    focus,
    focusLabel: focusLabels[focus],
    focusNote,
    notes: agent?.rationale?.length ? agent.rationale : [focusNote],
  };
}

function buildInputSummary(profile: SpaceProfile, mealSummary?: PlanMealSummary | null, currentPlanVersion?: number | null): PlanInputSummary {
  return {
    profileFields: usedProfileFields(profile),
    confirmedMeals: mealSummary?.recordCount ?? 0,
    recordedDays: mealSummary?.recordedDays ?? 0,
    macroCompleteMeals: mealSummary?.macroCompleteMeals ?? 0,
    completeDays: mealSummary?.completeDayCount ?? 0,
    mealWindowDays: mealSummary?.windowDays ?? 7,
    currentPlanVersion: currentPlanVersion ?? null,
  };
}

function buildAgentMeta(agent: PlanAgentDraft, profile: SpaceProfile, mealSummary?: PlanMealSummary | null, currentPlanVersion?: number | null): PlanAgentMeta {
  return {
    status: agent.status,
    model: agent.model,
    fallbackReason: agent.fallbackReason,
    inputSummary: buildInputSummary(profile, mealSummary, currentPlanVersion),
    toolLog: agent.toolLog,
    rationale: agent.rationale,
    adjustments: agent.adjustments,
    references: agent.references,
    ragStatus: agent.ragStatus,
  };
}

function targetsSignature(targets: SpaceTargets | null) {
  return targets
    ? `${targets.calorieLow}-${targets.calorieHigh} kcal · 蛋白质 ${targets.proteinLow}-${targets.proteinHigh} g · 饮水 ${targets.waterLow}-${targets.waterHigh} L`
    : "未生成热量与蛋白质目标";
}

function mealSignature(plan: PlanDocument) {
  return plan.diet.meals.map((meal) => `${meal.label}：${meal.title}`).join("；");
}

function movementSignature(plan: PlanDocument) {
  return `每周 ${plan.movement.sessionCount} 次 · 约 ${plan.movement.totalMinutes} 分钟 · ${plan.movement.environmentLabel}`;
}

function revisionSummary(previous: PlanDocument | null, plan: PlanDocument, changes: PlanRevision["changes"]) {
  if (!previous) return "首版：按资料建立热量、餐次与训练结构。";
  if (changes.length === 0) return "本次未改动热量、餐次或训练结构；新增了基于记录的建议说明与版本依据。";
  return `本次调整了 ${changes.map((change) => change.area).join("、")}；其余结构保持不变。`;
}

function buildRevision(previousPlan: PlanDocument | null | undefined, plan: PlanDocument): PlanRevision {
  if (!previousPlan) {
    return {
      basedOnVersion: null,
      changes: [],
      summary: "首版：按资料建立热量、餐次与训练结构。",
    };
  }

  const changes: PlanRevision["changes"] = [];
  const previousTargets = targetsSignature(previousPlan.targets);
  const nextTargets = targetsSignature(plan.targets);
  if (previousTargets !== nextTargets) {
    changes.push({ area: "热量与蛋白质", before: previousTargets, after: nextTargets });
  }
  const previousMeals = mealSignature(previousPlan);
  const nextMeals = mealSignature(plan);
  if (previousMeals !== nextMeals) {
    changes.push({ area: "餐次结构", before: previousMeals, after: nextMeals });
  }
  const previousMovement = movementSignature(previousPlan);
  const nextMovement = movementSignature(plan);
  if (previousMovement !== nextMovement) {
    changes.push({ area: "训练安排", before: previousMovement, after: nextMovement });
  }
  const previousFocus = previousPlan.coaching?.focusLabel ?? "无针对性调整";
  const nextFocus = plan.coaching?.focusLabel ?? "无针对性调整";
  if (previousFocus !== nextFocus) {
    changes.push({ area: "建议重点", before: previousFocus, after: nextFocus });
  }

  return {
    basedOnVersion: previousPlan.version,
    changes,
    summary: revisionSummary(previousPlan, plan, changes),
  };
}

export function buildPlan(profile: SpaceProfile, version = 1, now = new Date(), options: PlanBuildOptions = {}): PlanDocument {
  const targetResult = buildSpaceTargets(profile);
  const diet = buildDietPlan(profile);
  const movement = buildMovementPlan(profile);
  const completeness = spaceCompleteness(profile);
  const targets = targetResult.targets;
  const mealSummary = options.mealSummary;
  const agent = options.agent;
  const previousPlan = options.previousPlan ?? null;
  const coaching = buildCoaching(mealSummary, agent);

  const plan: PlanDocument = {
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
    dataBasis: buildDataBasis(profile, targets, mealSummary, agent),
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
    safety: buildSafety(profile, targets, targetResult.reason, mealSummary),
    coaching,
    agent: agent ? buildAgentMeta(agent, profile, mealSummary, previousPlan?.version ?? null) : null,
    revision: {
      basedOnVersion: previousPlan?.version ?? null,
      changes: [],
      summary: "",
    },
  };

  plan.revision = buildRevision(previousPlan, plan);
  return plan;
}

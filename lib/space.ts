export type SpaceGender = "female" | "male" | "unspecified";
export type SpaceGoal = "lose" | "maintain" | "gain" | "steady";
export type SpaceActivity = "low" | "light" | "moderate" | "high";
export type SpaceEnvironment = "home" | "gear" | "gym";
export type SpaceDiet = "balanced" | "takeout" | "protein" | "vegetarian" | "light";
export type SpaceDays = "2" | "3" | "4" | "5";
export type SpaceMinutes = "15" | "25" | "40";

export type SpaceProfile = {
  name: string;
  gender: SpaceGender;
  age: string;
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  goal: SpaceGoal;
  activity: SpaceActivity;
  days: SpaceDays;
  minutes: SpaceMinutes;
  environment: SpaceEnvironment;
  diet: SpaceDiet;
  avoid: string;
  budget: string;
  source: "demo" | "local";
  savedAt?: string;
};

export const goalLabels: Record<SpaceGoal, string> = {
  lose: "温和减脂",
  maintain: "保持状态",
  gain: "稳步增肌",
  steady: "先稳住节奏",
};

export const activityLabels: Record<SpaceActivity, string> = {
  low: "久坐为主",
  light: "轻度活动",
  moderate: "中等活动",
  high: "经常运动",
};

export const environmentLabels: Record<SpaceEnvironment, string> = {
  home: "居家 · 无器械",
  gear: "居家 · 小器械",
  gym: "健身房",
};

export const dietLabels: Record<SpaceDiet, string> = {
  balanced: "家常均衡",
  takeout: "外食友好",
  protein: "蛋白质优先",
  vegetarian: "素食为主",
  light: "清淡少油",
};

export const genderLabels: Record<SpaceGender, string> = {
  female: "女",
  male: "男",
  unspecified: "不透露",
};

export const goalOptions: Array<{ value: SpaceGoal; label: string }> = [
  { value: "lose", label: "温和减脂" },
  { value: "maintain", label: "保持状态" },
  { value: "gain", label: "稳步增肌" },
  { value: "steady", label: "先稳住节奏" },
];

export const activityOptions: Array<{ value: SpaceActivity; label: string }> = [
  { value: "low", label: "久坐为主" },
  { value: "light", label: "轻度活动" },
  { value: "moderate", label: "中等活动" },
  { value: "high", label: "经常运动" },
];

export const dayOptions: Array<{ value: SpaceDays; label: string }> = [
  { value: "2", label: "2 次" },
  { value: "3", label: "3 次" },
  { value: "4", label: "4 次" },
  { value: "5", label: "5 次" },
];

export const minuteOptions: Array<{ value: SpaceMinutes; label: string }> = [
  { value: "15", label: "15 分钟" },
  { value: "25", label: "25 分钟" },
  { value: "40", label: "40 分钟" },
];

export const environmentOptions: Array<{ value: SpaceEnvironment; label: string }> = [
  { value: "home", label: "居家 · 无器械" },
  { value: "gear", label: "居家 · 小器械" },
  { value: "gym", label: "健身房" },
];

export const dietOptions: Array<{ value: SpaceDiet; label: string }> = [
  { value: "balanced", label: "家常均衡" },
  { value: "takeout", label: "外食友好" },
  { value: "protein", label: "蛋白质优先" },
  { value: "vegetarian", label: "素食为主" },
  { value: "light", label: "清淡少油" },
];

const coreFields: Array<[keyof SpaceProfile, string]> = [
  ["name", "称呼"],
  ["age", "年龄"],
  ["heightCm", "身高"],
  ["weightKg", "体重"],
  ["goal", "健康目标"],
  ["activity", "活动水平"],
  ["days", "每周次数"],
  ["minutes", "每次时长"],
  ["environment", "训练环境"],
  ["diet", "饮食偏好"],
];

function text(value: unknown, fallback = "", max = 400) {
  return typeof value === "string" ? value.slice(0, max) : fallback;
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? value as T : fallback;
}

export function createDemoSpaceProfile(name = "林同学", weightKg: number | null = 63.4): SpaceProfile {
  return {
    name: name || "林同学",
    gender: "unspecified",
    age: "28",
    heightCm: "168",
    weightKg: weightKg ? String(weightKg) : "63.4",
    targetWeightKg: "58",
    goal: "lose",
    activity: "light",
    days: "3",
    minutes: "25",
    environment: "home",
    diet: "takeout",
    avoid: "花生",
    budget: "60",
    source: "demo",
  };
}

export function createEmptySpaceProfile(name = ""): SpaceProfile {
  return {
    name,
    gender: "unspecified",
    age: "",
    heightCm: "",
    weightKg: "",
    targetWeightKg: "",
    goal: "maintain",
    activity: "light",
    days: "3",
    minutes: "25",
    environment: "home",
    diet: "balanced",
    avoid: "",
    budget: "",
    source: "local",
  };
}

export const SPACE_PROFILE_KEY = "zhiyang-space-profile-v1";

export function normalizeSpaceProfile(raw: unknown): SpaceProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<SpaceProfile>;
  return {
    name: text(value.name, "", 12),
    gender: pick(value.gender, ["female", "male", "unspecified"], "unspecified"),
    age: text(value.age, "", 4),
    heightCm: text(value.heightCm, "", 6),
    weightKg: text(value.weightKg, "", 6),
    targetWeightKg: text(value.targetWeightKg, "", 6),
    goal: pick(value.goal, ["lose", "maintain", "gain", "steady"], "maintain"),
    activity: pick(value.activity, ["low", "light", "moderate", "high"], "light"),
    days: pick(value.days, ["2", "3", "4", "5"], "3"),
    minutes: pick(value.minutes, ["15", "25", "40"], "25"),
    environment: pick(value.environment, ["home", "gear", "gym"], "home"),
    diet: pick(value.diet, ["balanced", "takeout", "protein", "vegetarian", "light"], "balanced"),
    avoid: text(value.avoid, "", 80),
    budget: text(value.budget, "", 6),
    source: value.source === "demo" ? "demo" : "local",
    ...(typeof value.savedAt === "string" ? { savedAt: value.savedAt } : {}),
  };
}

export function readStoredSpaceProfile(): SpaceProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SPACE_PROFILE_KEY);
    if (!raw) return null;
    return normalizeSpaceProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeStoredSpaceProfile(profile: SpaceProfile) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(SPACE_PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

function numeric(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function spaceCompleteness(profile: SpaceProfile | null) {
  const total = coreFields.length;
  if (!profile) return { filled: 0, total, missing: coreFields.map(([, label]) => label) };
  const missing = coreFields
    .filter(([key]) => !String(profile[key] ?? "").trim())
    .map(([, label]) => label);
  return { filled: total - missing.length, total, missing };
}

export type SpaceTargets = {
  bmi: number;
  calorieLow: number;
  calorieHigh: number;
  proteinLow: number;
  proteinHigh: number;
  waterLow: number;
  waterHigh: number;
};

export type SpaceTargetResult = {
  targets: SpaceTargets | null;
  reason: string | null;
};

const activityFactors: Record<SpaceActivity, number> = {
  low: 1.35,
  light: 1.5,
  moderate: 1.65,
  high: 1.8,
};

export function buildSpaceTargets(profile: SpaceProfile): SpaceTargetResult {
  const age = numeric(profile.age);
  const height = numeric(profile.heightCm);
  const weight = numeric(profile.weightKg);
  if (age === null || height === null || weight === null) {
    return { targets: null, reason: "补充年龄、身高和体重后，才会给出热量参考。餐次与运动结构仍可先用。" };
  }
  if (age < 18) {
    return { targets: null, reason: "未成年人不做热量估算，请以家长、学校或专业人士的建议为准。" };
  }
  if (age > 90 || height < 130 || height > 220 || weight < 35 || weight > 200) {
    return { targets: null, reason: "年龄、身高或体重超出本页的常见范围，先核对一下数值；暂时不估算。" };
  }

  const base = 10 * weight + 6.25 * height - 5 * age;
  const factor = activityFactors[profile.activity];
  const goalShift = profile.goal === "lose" ? -250 : profile.goal === "gain" ? 200 : 0;

  const targetFor = (sexShift: number) => {
    const raw = (base + sexShift) * factor + goalShift;
    return Math.max(1400, Math.round(raw / 10) * 10);
  };

  let low: number;
  let high: number;
  if (profile.gender === "male") {
    const target = targetFor(5);
    low = target - 70;
    high = target + 70;
  } else if (profile.gender === "female") {
    const target = targetFor(-161);
    low = target - 70;
    high = target + 70;
  } else {
    low = targetFor(-161) - 40;
    high = targetFor(5) + 40;
  }
  low = Math.max(1400, Math.round(low / 10) * 10);
  high = Math.max(low + 60, Math.round(high / 10) * 10);

  const proteinBase = weight * (profile.goal === "gain" ? 1.6 : profile.goal === "lose" ? 1.4 : 1.2);
  const bmi = weight / (height / 100) ** 2;

  return {
    targets: {
      bmi: Math.round(bmi * 10) / 10,
      calorieLow: low,
      calorieHigh: high,
      proteinLow: Math.round((proteinBase - 8) / 5) * 5,
      proteinHigh: Math.round((proteinBase + 8) / 5) * 5,
      waterLow: Math.round(weight * 0.3) / 10,
      waterHigh: Math.round(weight * 0.35) / 10,
    },
    reason: null,
  };
}

export function buildGoalLine(profile: SpaceProfile) {
  const weight = numeric(profile.weightKg);
  const target = numeric(profile.targetWeightKg);
  if (target === null) return null;
  if (weight === null) return `目标体重 ${target.toFixed(1)} kg；补充当前体重后，才能看到差距。`;
  const diff = target - weight;
  if (Math.abs(diff) < 0.05) return `已经到达填写的目标体重（${target.toFixed(1)} kg）。`;
  return diff < 0
    ? `当前 ${weight.toFixed(1)} kg → 目标 ${target.toFixed(1)} kg，还差 ${Math.abs(diff).toFixed(1)} kg。`
    : `当前 ${weight.toFixed(1)} kg → 目标 ${target.toFixed(1)} kg，比目标低 ${diff.toFixed(1)} kg。`;
}

export type DietSlot = {
  time: string;
  label: string;
  title: string;
  detail: string;
  swap: string;
};

const dietTemplates: Record<SpaceDiet, DietSlot[]> = {
  balanced: [
    { time: "08:00", label: "早餐", title: "燕麦酸奶碗", detail: "燕麦 40g、无糖酸奶一杯、水果一小份。", swap: "乳糖不耐就换无糖豆浆；燕麦可以换小米粥。" },
    { time: "12:30", label: "午餐", title: "番茄鸡胸杂粮饭", detail: "半盘蔬菜、掌心大小的鸡胸、一拳杂粮饭。", swap: "外食选少油盖饭，酱汁分开放。" },
    { time: "16:00", label: "加餐", title: "水果和原味酸奶", detail: "不饿可以省；酸奶选无糖。", swap: "可以换无糖豆浆或一小把南瓜籽。" },
    { time: "19:00", label: "晚餐", title: "香煎鸡腿配时蔬", detail: "鸡腿去皮，配两份蔬菜和半碗主食。", swap: "鸡腿可以换鱼、虾或豆腐，按你能吃的来。" },
  ],
  takeout: [
    { time: "08:00", label: "早餐", title: "全麦三明治和无糖豆浆", detail: "在路上买也方便；酱料少一点。", swap: "没有全麦就选普通面包，加一个鸡蛋。" },
    { time: "12:30", label: "午餐", title: "少油盖饭，加一份青菜", detail: "米饭留三分之一，酱汁分开放。", swap: "优先选蒸、煮、炖的做法，避开油炸。" },
    { time: "16:00", label: "加餐", title: "水果和原味酸奶", detail: "下午饿的时候先补这一份。", swap: "便利店可以选无糖酸奶或茶叶蛋。" },
    { time: "19:00", label: "晚餐", title: "清汤面、卤蛋和烫青菜", detail: "汤底少盐，青菜单独加一份。", swap: "面可以换米粉或米饭；卤蛋换豆腐也行。" },
  ],
  protein: [
    { time: "08:00", label: "早餐", title: "鸡蛋、希腊酸奶和全麦吐司", detail: "蛋白质先到位，再补一份水果。", swap: "乳糖不耐就换无糖豆浆；吐司可以换玉米。" },
    { time: "12:30", label: "午餐", title: "鸡胸牛肉双拼杂粮饭", detail: "两份掌心大小的蛋白质，配半盘蔬菜。", swap: "吃不完就少饭多菜，不用硬撑。" },
    { time: "16:00", label: "加餐", title: "牛奶或无糖豆浆", detail: "训练日可以加一份水果。", swap: "喝不惯就换成原味酸奶。" },
    { time: "19:00", label: "晚餐", title: "鸡腿豆腐锅", detail: "鸡腿去皮，豆腐和菌菇一起煮。", swap: "鸡腿可以换鱼虾；豆腐可以换鸡蛋。" },
  ],
  vegetarian: [
    { time: "08:00", label: "早餐", title: "豆浆燕麦和豆腐干", detail: "燕麦一小碗，豆腐干一两块。", swap: "蛋奶素可以加一个水煮蛋。" },
    { time: "12:30", label: "午餐", title: "豆腐菌菇杂粮饭", detail: "半盘蔬菜，豆腐和菌菇各一份。", swap: "豆制品吃腻了就换鹰嘴豆或鸡蛋。" },
    { time: "16:00", label: "加餐", title: "水果和南瓜籽", detail: "南瓜籽一小把就够。", swap: "可以换无糖酸奶或豆浆。" },
    { time: "19:00", label: "晚餐", title: "鹰嘴豆蔬菜汤和全麦面包", detail: "汤里加两份蔬菜，面包一两片。", swap: "鹰嘴豆可以换扁豆或豆腐。" },
  ],
  light: [
    { time: "08:00", label: "早餐", title: "小米粥、水煮蛋和凉拌菜", detail: "粥一小碗，凉拌菜少油少盐。", swap: "赶时间就换成无糖豆浆和全麦面包。" },
    { time: "12:30", label: "午餐", title: "清蒸鱼、时蔬和半碗饭", detail: "鱼选清蒸，蔬菜可以多一份。", swap: "鱼可以换鸡腿或豆腐，按你能吃的来。" },
    { time: "16:00", label: "加餐", title: "水果一小份", detail: "不饿就省掉，等正餐。", swap: "可以换无糖酸奶。" },
    { time: "19:00", label: "晚餐", title: "豆腐蔬菜汤和少量主食", detail: "晚餐清淡一点，主食按饥饿感留。", swap: "豆腐可以换鸡蛋或鸡胸。" },
  ],
};

export function buildDietPlan(profile: SpaceProfile) {
  const avoid = profile.avoid.trim();
  const budget = numeric(profile.budget);
  const meals = dietTemplates[profile.diet].map((meal) => ({ ...meal }));
  const avoidNote = avoid
    ? `已记录需要避开：${avoid}。下面是通用结构，具体配料请按忌口替换；外食前再确认一次。`
    : "还没有填写忌口；如果存在过敏，先补充，再按这个结构准备。";
  const budgetNote = budget !== null
    ? `预算约 ¥${budget}/天：优先把预算放在蛋白质和蔬菜上，早餐和加餐尽量在家解决。`
    : "没有填写预算；外食时先选蛋白质和蔬菜，再看价格。";
  return { meals, avoidNote, budgetNote };
}

type SessionTone = "strength" | "cardio" | "mobility";

type SessionTemplate = { title: string; focus: string };

const sessionCatalog: Record<SpaceEnvironment, Record<SessionTone, SessionTemplate[]>> = {
  home: {
    strength: [
      { title: "力量 A", focus: "椅子深蹲 · 臀桥 · 死虫" },
      { title: "力量 B", focus: "墙面俯卧撑 · 毛巾划船 · 平板支撑" },
      { title: "全身循环", focus: "深蹲 · 俯卧撑 · 臀桥 · 原地走" },
    ],
    cardio: [
      { title: "快走", focus: "能说短句的速度，保持节奏" },
      { title: "轻快走", focus: "平地快走，最后 3 分钟放慢" },
      { title: "室内有氧", focus: "原地走 · 低冲击开合步" },
    ],
    mobility: [
      { title: "活动度", focus: "肩颈绕环 · 髋部拉伸 · 小腿放松" },
      { title: "恢复日", focus: "轻松走 · 慢呼吸 · 睡前拉伸" },
    ],
  },
  gear: {
    strength: [
      { title: "弹力带全身", focus: "深蹲 · 划船 · 推举" },
      { title: "上肢与背部", focus: "弹力带划船 · 面拉 · 俯卧撑" },
      { title: "下肢与核心", focus: "弹力带硬拉 · 侧向走 · 死虫" },
    ],
    cardio: [
      { title: "快走 + 台阶", focus: "平地快走与低台阶交替" },
      { title: "轻快走", focus: "能说短句的速度，保持节奏" },
      { title: "低冲击有氧", focus: "原地走 · 弹力带侧步" },
    ],
    mobility: [
      { title: "活动度", focus: "肩颈 · 髋部 · 小腿" },
      { title: "恢复日", focus: "轻松走 · 慢呼吸 · 拉伸" },
    ],
  },
  gym: {
    strength: [
      { title: "器械全身 A", focus: "腿举 · 推胸 · 坐姿划船" },
      { title: "器械全身 B", focus: "髋铰链 · 高位下拉 · 肩推" },
      { title: "自由重量", focus: "深蹲 · 罗马尼亚硬拉 · 俯卧撑" },
    ],
    cardio: [
      { title: "坡度快走", focus: "中等坡度，能说短句" },
      { title: "椭圆机", focus: "低冲击，保持均匀呼吸" },
      { title: "单车", focus: "轻松骑，最后 3 分钟放慢" },
    ],
    mobility: [
      { title: "活动度", focus: "肩颈 · 髋部 · 小腿" },
      { title: "恢复日", focus: "轻松走 · 慢呼吸 · 拉伸" },
    ],
  },
};

const sessionPattern: Record<SpaceGoal, SessionTone[]> = {
  lose: ["strength", "cardio", "strength", "cardio", "mobility"],
  maintain: ["strength", "cardio", "strength", "mobility", "cardio"],
  gain: ["strength", "strength", "cardio", "strength", "mobility"],
  steady: ["strength", "mobility", "strength", "cardio", "mobility"],
};

const trainingDays: Record<SpaceDays, number[]> = {
  "2": [1, 5],
  "3": [1, 3, 5],
  "4": [0, 1, 3, 5],
  "5": [0, 1, 3, 4, 5],
};

const weekLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const weekShorts = ["一", "二", "三", "四", "五", "六", "日"];

export type SpaceSession = {
  day: string;
  short: string;
  title: string;
  focus: string;
  minutes: number;
  tone: SessionTone;
};

export function buildMovementPlan(profile: SpaceProfile) {
  const totalMinutes = Number(profile.minutes);
  const days = trainingDays[profile.days];
  const pattern = sessionPattern[profile.goal];
  const used: Record<SessionTone, number> = { strength: 0, cardio: 0, mobility: 0 };
  const catalog = sessionCatalog[profile.environment];

  const sessions: SpaceSession[] = days.map((dayIndex, index) => {
    const tone = pattern[index % pattern.length];
    const template = catalog[tone][used[tone] % catalog[tone].length];
    used[tone] += 1;
    const minutes = tone === "mobility" ? Math.min(totalMinutes, 20) : totalMinutes;
    return { day: weekLabels[dayIndex], short: weekShorts[dayIndex], ...template, minutes, tone };
  });

  const byDay = new Map<number, SpaceSession>();
  days.forEach((dayIndex, index) => byDay.set(dayIndex, sessions[index]));
  const week = weekLabels.map((label, index) => ({
    label,
    short: weekShorts[index],
    session: byDay.get(index) ?? null,
  }));

  return {
    sessions,
    week,
    sessionCount: sessions.length,
    totalMinutes: sessions.reduce((sum, session) => sum + session.minutes, 0),
    environmentLabel: environmentLabels[profile.environment],
  };
}

export function buildSpacePlans(profile: SpaceProfile) {
  const targetResult = buildSpaceTargets(profile);
  return {
    completeness: spaceCompleteness(profile),
    targets: targetResult.targets,
    targetsReason: targetResult.reason,
    goalLine: buildGoalLine(profile),
    diet: buildDietPlan(profile),
    movement: buildMovementPlan(profile),
  };
}

export type SpaceFieldErrorKey = "name" | "age" | "heightCm" | "weightKg" | "targetWeightKg" | "budget" | "avoid";
export type SpaceFieldErrors = Partial<Record<SpaceFieldErrorKey, string>>;

export function validateSpaceProfile(profile: SpaceProfile): SpaceFieldErrors {
  const errors: SpaceFieldErrors = {};
  const name = profile.name.trim();
  if (!name) errors.name = "先写一个称呼，规划里会用到。";
  else if (name.length > 12) errors.name = "称呼最多 12 个字。";

  const age = numeric(profile.age);
  if (profile.age.trim() && (age === null || !Number.isInteger(age) || age < 14 || age > 90)) {
    errors.age = "填写 14–90 之间的整数；不确定可以先留空。";
  }
  const height = numeric(profile.heightCm);
  if (profile.heightCm.trim() && (height === null || height < 130 || height > 220)) {
    errors.heightCm = "填写 130–220 cm 之间的身高。";
  }
  const weight = numeric(profile.weightKg);
  if (profile.weightKg.trim() && (weight === null || weight < 35 || weight > 200)) {
    errors.weightKg = "填写 35–200 kg 之间的体重。";
  }
  const target = numeric(profile.targetWeightKg);
  if (profile.targetWeightKg.trim() && (target === null || target < 35 || target > 200)) {
    errors.targetWeightKg = "填写 35–200 kg 之间的目标体重。";
  }
  if (weight !== null && target !== null) {
    if (profile.goal === "lose" && target >= weight) errors.targetWeightKg = "减脂目标通常应低于当前体重，请再确认。";
    if (profile.goal === "gain" && target <= weight) errors.targetWeightKg = "增肌目标通常应高于当前体重，请再确认。";
  }
  const budget = numeric(profile.budget);
  if (profile.budget.trim() && (budget === null || budget < 0 || budget > 1000)) {
    errors.budget = "填写 0–1000 元之间的数字。";
  }
  if (profile.avoid.trim().length > 80) errors.avoid = "忌口说明最多 80 字。";
  return errors;
}

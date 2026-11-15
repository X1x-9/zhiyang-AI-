export type SafetyLevel = "routine" | "caution" | "emergency";

export type SafetyAssessment = {
  level: SafetyLevel;
  reasons: string[];
  directive: string;
};

type SafetyRule = { id: string; pattern: RegExp };

const EMERGENCY_RULES: SafetyRule[] = [
  { id: "self_harm", pattern: /自杀|轻生|不想活|活不下去|结束生命|伤害自己|割腕|跳楼|自伤/ },
  { id: "chest_pain", pattern: /胸(?:口|部|前区)?[^，。；！？,.;!?]{0,4}(?:疼|痛|闷|压迫)/ },
  { id: "breathing", pattern: /呼吸困难|喘不上气|喘不过气|窒息|喉咙(?:发紧|水肿)/ },
  { id: "consciousness", pattern: /昏厥|晕倒|昏迷|意识不清|抽搐|癫痫(?:发作)?/ },
  { id: "stroke", pattern: /口角歪斜|半身不遂|一侧肢体无力|言语不清|说话含糊/ },
  { id: "bleeding", pattern: /大出血|血流不止|呕血|咯血/ },
  { id: "anaphylaxis", pattern: /过敏性休克/ },
  { id: "poisoning", pattern: /中毒|误服|喝农药|药物过量|过量服药/ },
  { id: "severe_pain", pattern: /剧烈(?:腹|头)(?:痛|疼)|腹部剧痛|突发剧烈头痛/ },
];

const CAUTION_RULES: SafetyRule[] = [
  { id: "pregnancy", pattern: /怀孕|妊娠|孕期|备孕|哺乳|产妇/ },
  { id: "chronic_disease", pattern: /糖尿病|高血压|高血糖|高血脂|痛风|肾病|肾脏|心脏病|冠心病|脂肪肝|甲亢|甲减|多囊|慢性病|慢病/ },
  { id: "medical_treatment", pattern: /处方|用药|吃药|服药|药物|剂量|停药|诊断|治疗|手术|化疗|透析|检查报告|化验单/ },
  { id: "eating_disorder", pattern: /暴食|厌食|催吐|饮食失调|进食障碍|闭经|体重骤降/ },
  { id: "mental_health", pattern: /抑郁|焦虑|情绪低落|心理问题|失眠/ },
];

const NEGATION = /(?:没有|没|无|不|未|否认|并非|不是)[^，。；！？,.;!?]{0,3}$/;

function matchedRules(text: string, rules: SafetyRule[]) {
  const reasons: string[] = [];
  for (const rule of rules) {
    const match = rule.pattern.exec(text);
    if (!match) continue;
    const negated = isNegated(text, match.index);
    if (!negated) reasons.push(rule.id);
  }
  return reasons;
}

function isNegated(text: string, index: number) {
  return NEGATION.test(text.slice(Math.max(0, index - 8), index));
}

export const EMERGENCY_REPLY = [
  "这听起来可能是需要立即处理的情况。请先保证安全：如果症状正在发生或加重，马上拨打 120，或请身边的人陪你去最近的急诊。",
  "如果你或身边的人正处于自伤、轻生风险中，请立即拨打 110 或心理援助热线 12356，并尽量不要独处。",
  "在等待救援时，保持呼吸通畅，不要自行加药、催吐或进食；如已知有严重过敏，按医生既往指导使用急救药物。",
  "线上文字无法判断病情，我不能给出诊断或用药建议。等症状稳定后，再和医生讨论检查与后续管理。",
].join("\n\n");

const CAUTION_DIRECTIVE = "本轮问题涉及特殊人群、慢性病或医疗处置。只提供一般健康信息，不作诊断、处方、剂量或停药建议；建议用户就个体情况咨询医生或注册营养师，并提醒出现急症时及时就医。";

export function assessHealthSafety(text: string): SafetyAssessment {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return { level: "routine", reasons: [], directive: "" };

  const emergency = matchedRules(normalized, EMERGENCY_RULES);
  if (emergency.length) {
    return { level: "emergency", reasons: emergency, directive: "本轮触发急症或自伤风险规则。不要依赖模型生成回答，直接使用固定的紧急处置文案。" };
  }

  const caution = matchedRules(normalized, CAUTION_RULES);
  if (caution.length) {
    return { level: "caution", reasons: caution, directive: CAUTION_DIRECTIVE };
  }

  return { level: "routine", reasons: [], directive: "" };
}

export type OutputGuardCategory = "self_harm_method" | "medication" | "diagnosis" | "care_dismissal";

type OutputGuardRule = { id: OutputGuardCategory; pattern: RegExp; replacement: string };

const OUTPUT_GUARD_RULES: OutputGuardRule[] = [
  {
    id: "self_harm_method",
    pattern: /(?:自杀|轻生)(?:的)?(?:方法|方式|办法)|怎么(?:自杀|轻生)/,
    replacement: "涉及自伤风险时，请立即联系 110 或心理援助热线 12356，并尽量不要独处。",
  },
  {
    id: "medication",
    pattern: /(?:建议|可以|应该|需要|不妨|直接)(?:自行)?(?:停|减|加|换)(?:药|用|服)|(?:建议|可以|应该|需要|不妨|试试)(?:服用|用药|吃药|注射|打)[^。！？；\n]{0,20}(?:药|片|胶囊|针剂|mg|毫克|单位|布洛芬|对乙酰氨基酚|阿司匹林|二甲双胍|胰岛素|褪黑素|抗生素|维生素)|(?:服用|用药|吃药|注射)[^。！？；\n]{0,16}\d+(?:\.\d+)?\s*(?:mg|毫克|片|粒|单位|iu)|(?:建议|可以|应该|需要)(?:吃|用)[^。！？；\n]{0,12}(?:维生素|钙片|鱼油|蛋白粉|褪黑素|布洛芬|对乙酰氨基酚|二甲双胍|胰岛素)[^。！？；\n]{0,12}(?:\d|片|粒|mg|毫克)/i,
    replacement: "用药、剂量与是否停药请遵循医生的处方，我不能提供个体用药建议。",
  },
  {
    id: "diagnosis",
    pattern: /(?:你|您|这|那)(?:得了|患了|患有|确诊为|诊断为)|(?:确诊|诊断)(?:为|是)|(?:你|您|这|那)?(?:很可能是|可能是|应该是|就是|属于|是)[^。！？；\n]{0,4}(?:糖尿病|高血压|贫血|骨质疏松|感冒|流感|胃炎|胃溃疡|肠炎|焦虑症|抑郁症|失眠症|脂肪肝|冠心病|甲状腺|多囊|感染|综合征)/,
    replacement: "具体原因需要医生结合检查判断，我不能给出疾病诊断。",
  },
  {
    id: "care_dismissal",
    pattern: /(?:不用|无需|不必|不需要)(?:去)?(?:医院|就医|看医生|检查|复查)|(?:没|没有)大碍/,
    replacement: "如果症状持续或加重，建议及时就医，不要仅凭线上信息判断。",
  },
];

const OUTPUT_GUARD_ORDER: OutputGuardCategory[] = ["self_harm_method", "medication", "diagnosis", "care_dismissal"];
const SENTENCE_PATTERN = /[^。！？!?；;\n]+[。！？!?；;\n]?/g;

export const OUTPUT_GUARD_NOTICE = "以上为一般健康信息，不能替代医生的诊断和处方。";

export type OutputGuardResult = {
  text: string;
  flagged: OutputGuardCategory[];
  changed: boolean;
};

export function guardAssistantOutput(text: string): OutputGuardResult {
  const flagged = new Set<OutputGuardCategory>();
  const guarded = text.replace(SENTENCE_PATTERN, (sentence) => {
    const hits = OUTPUT_GUARD_RULES.filter((rule) => rule.pattern.test(sentence));
    if (!hits.length) return sentence;
    for (const hit of hits) flagged.add(hit.id);
    const category = OUTPUT_GUARD_ORDER.find((id) => flagged.has(id)) ?? hits[0].id;
    const replacement = OUTPUT_GUARD_RULES.find((rule) => rule.id === category)?.replacement ?? hits[0].replacement;
    const prefix = sentence.match(/^(\s*(?:\d+[.、]|[·•-])\s*)/)?.[1] ?? "";
    return `${prefix}${replacement}${sentence.endsWith("\n") ? "\n" : ""}`;
  });
  return { text: guarded, flagged: [...flagged], changed: flagged.size > 0 };
}

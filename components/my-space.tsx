"use client";

import * as React from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleAlert,
  Info,
  RotateCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { GrowingLoader, Reveal } from "@/components/experience";
import { GlitchButton } from "@/components/glitch-button";
import HeroAccordion from "@/components/hero-accordion";
import type { DashboardData } from "@/lib/dashboard";
import {
  activityOptions,
  buildSpacePlans,
  createDemoSpaceProfile,
  dayOptions,
  dietLabels,
  dietOptions,
  environmentLabels,
  environmentOptions,
  goalLabels,
  goalOptions,
  minuteOptions,
  spaceCompleteness,
  validateSpaceProfile,
  writeStoredSpaceProfile,
  type SpaceFieldErrorKey,
  type SpaceFieldErrors,
  type SpaceGender,
  type SpaceProfile,
} from "@/lib/space";
import { useHealthStore } from "@/stores/health-store";

const ease = [0.22, 1, 0.36, 1] as const;

const heroGalleryItems = [
  { image: "/images/plan-exercise-hero.webp", alt: "" },
  { image: "/images/hero-accordion-water.webp", alt: "" },
  { image: "/images/zhiyang-hero-garden.webp", alt: "" },
  { image: "/images/plan-diet-hero.webp", alt: "" },
  { image: "/images/hero-accordion-canopy.webp", alt: "" },
];

const genderOptions: Array<{ value: SpaceGender; label: string }> = [
  { value: "female", label: "女" },
  { value: "male", label: "男" },
  { value: "unspecified", label: "不透露" },
];

type MySpaceProps = {
  data?: DashboardData;
  loading: boolean;
  profile: SpaceProfile;
  hasStored: boolean;
};

type ChoiceOption<T extends string> = { value: T; label: string };

function ChoiceGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
  wide,
}: {
  legend: string;
  value: T;
  options: ReadonlyArray<ChoiceOption<T>>;
  onChange: (value: T) => void;
  wide?: boolean;
}) {
  return (
    <fieldset className={`ms-choice-set${wide ? " ms-choice-wide" : ""}`}>
      <legend>{legend}</legend>
      <div className="ms-choice">
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={legend}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ms-field">
      <label htmlFor={id}>
        {label}
        {hint && <small>{hint}</small>}
      </label>
      {children}
      {error && <p className="ms-error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

function formatMoment(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (amount: number) => String(amount).padStart(2, "0");
  return `${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function MySpace({ data, loading, profile, hasStored }: MySpaceProps) {
  const setPage = useHealthStore((state) => state.setPage);
  const setSpaceProfile = useHealthStore((state) => state.setSpaceProfile);
  const reduce = useReducedMotion();
  const heroStageRef = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const plansRef = React.useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 170, damping: 20, mass: 0.6 });
  const rotateY = useSpring(0, { stiffness: 170, damping: 20, mass: 0.6 });
  const heroScale = useSpring(1, { stiffness: 200, damping: 24 });
  const heroChars = Array.from("我的空间。");

  const [draft, setDraft] = React.useState<SpaceProfile>(profile);
  const [draftBase, setDraftBase] = React.useState<SpaceProfile>(profile);
  const [errors, setErrors] = React.useState<SpaceFieldErrors>({});
  const [status, setStatus] = React.useState<{ kind: "idle" | "saved" | "error"; text: string }>({
    kind: "idle",
    text: "",
  });

  if (profile !== draftBase) {
    setDraftBase(profile);
    setDraft(profile);
    setErrors({});
  }

  React.useEffect(() => {
    if (!Object.values(errors).some(Boolean)) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);

  const handleHeroTilt = (event: React.PointerEvent<HTMLDivElement>) => {
    const stage = heroStageRef.current;
    if (reduce || event.pointerType !== "mouse" || !stage) return;
    if (!window.matchMedia("(hover: hover) and (min-width: 961px)").matches) return;
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-y * 2.8);
    rotateY.set(x * 3.4);
    heroScale.set(1.006);
    stage.style.setProperty("--ms-glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
    stage.style.setProperty("--ms-glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
    stage.dataset.tilting = "true";
  };

  const resetHeroTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
    heroScale.set(1);
    if (heroStageRef.current) delete heroStageRef.current.dataset.tilting;
  };

  const completeness = spaceCompleteness(draft);
  const plans = buildSpacePlans(draft);
  const goalLine = plans.goalLine;
  const isDemo = !hasStored && Boolean(data?.demo);
  const savedMoment = hasStored ? formatMoment(draft.savedAt) : "";
  const sourceLabel = hasStored ? "已保存到本机" : isDemo ? "演示资料 · 尚未保存" : "尚未填写";
  const sourceClass = hasStored ? "is-saved" : isDemo ? "is-demo" : "is-empty";
  const name = draft.name.trim();
  const initial = name.slice(0, 1) || "你";

  const height = Number(draft.heightCm);
  const weight = Number(draft.weightKg);
  const bmi = draft.heightCm.trim() && draft.weightKg.trim()
    && Number.isFinite(height) && Number.isFinite(weight)
    && height >= 130 && height <= 220 && weight >= 35 && weight <= 200
    ? weight / (height / 100) ** 2
    : null;

  function update<K extends keyof SpaceProfile>(key: K, value: SpaceProfile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as SpaceFieldErrorKey]) return current;
      return { ...current, [key]: undefined };
    });
    setStatus((current) => current.kind === "idle" ? current : { kind: "idle", text: "" });
  }

  function goTo(ref: React.RefObject<HTMLElement | null>) {
    const node = ref.current;
    if (!node) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    node.focus({ preventScroll: true });
  }

  function fillDemo() {
    if (!data?.demo) return;
    setDraft(createDemoSpaceProfile(data.displayName, data.weightKg));
    setErrors({});
    setStatus({ kind: "idle", text: "已填入演示资料；修改后保存，才会留在本机。" });
  }

  function resetDraft() {
    setDraft(profile);
    setErrors({});
    setStatus({ kind: "idle", text: hasStored ? "已恢复到上次保存的资料。" : "已恢复到初始内容。" });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSpaceProfile(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus({ kind: "error", text: "还有几项需要确认，已标在对应字段下面。" });
      return;
    }
    const saved: SpaceProfile = {
      ...draft,
      name: draft.name.trim(),
      age: draft.age.trim(),
      heightCm: draft.heightCm.trim(),
      weightKg: draft.weightKg.trim(),
      targetWeightKg: draft.targetWeightKg.trim(),
      avoid: draft.avoid.trim(),
      budget: draft.budget.trim(),
      source: "local",
      savedAt: new Date().toISOString(),
    };
    const stored = writeStoredSpaceProfile(saved);
    setSpaceProfile(saved);
    setDraft(saved);
    setErrors({});
    setStatus({
      kind: "saved",
      text: stored
        ? `已保存到本机 · ${formatMoment(saved.savedAt)}。饮食与运动计划已按新资料重排。`
        : "已更新当前页面，但浏览器存储不可用；刷新后会丢失。",
    });
  }

  if (loading && !hasStored) {
    return <div className="ms-shell"><div className="ms-loading"><GrowingLoader label="正在准备你的空间…" /></div></div>;
  }

  const targets = plans.targets;
  const targetsNote = targets
    ? "热量用 Mifflin-St Jeor 与活动系数估算，蛋白质和饮水按体重估算；只作日常参考，不是医学评估或营养处方。"
    : plans.targetsReason ?? "补充年龄、身高和体重后，才会给出热量参考。";

  return (
    <div className="ms-shell">
      <div
        ref={heroStageRef}
        className="ms-hero-stage"
        onPointerMove={handleHeroTilt}
        onPointerLeave={resetHeroTilt}
        onPointerCancel={resetHeroTilt}
      >
        <motion.section
          className="ms-hero"
          aria-labelledby="ms-title"
          style={reduce ? undefined : { rotateX, rotateY, scale: heroScale }}
        >
        <div className="ms-hero-gallery">
          <HeroAccordion
            items={heroGalleryItems}
            defaultIndex={2}
            expandRatio={0.42}
            duration={0.9}
            autoPlayMs={9000}
            reduced={!!reduce}
          />
        </div>
        <span className="ms-hero-veil" aria-hidden="true" />
        <motion.div
          className="ms-hero-copy"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.62, ease }}
        >
          <h1 id="ms-title" className="ms-title-3d" aria-label="我的空间。">
            {heroChars.map((char, index) => (
              <span
                key={`${char}-${index}`}
                className={`ms-char${char === "。" ? " ms-char-dot" : ""}`}
                style={{ "--char-index": index } as React.CSSProperties}
                aria-hidden="true"
              >
                {char}
              </span>
            ))}
          </h1>
          <p className="ms-hero-lede">
            把身体的情况和生活的节奏写在这里。饮食与运动计划，会跟着你填的内容重新排；没填的部分，保持空白。
          </p>
          <div className="ms-hero-meta" aria-label="资料状态">
            <span className={`ms-source ${sourceClass}`}><i aria-hidden="true" />{sourceLabel}</span>
            <span>资料 {completeness.filled}/{completeness.total}</span>
            {savedMoment && <span>上次保存 {savedMoment}</span>}
          </div>
          <div className="ms-hero-actions">
            <GlitchButton tone="cream" className="ms-hero-fill" onClick={() => goTo(formRef)}>
              填写资料 <ArrowDown size={15} aria-hidden="true" />
            </GlitchButton>
            <button type="button" className="ms-hero-link" onClick={() => goTo(plansRef)}>
              看生成的计划 <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        <div className="ms-stack">
          <span className="ms-stack-layer ms-stack-one" aria-hidden="true" />
          <span className="ms-stack-layer ms-stack-two" aria-hidden="true" />
          <motion.aside
            className="ms-pass"
            aria-label="个人档案摘要"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.72, delay: reduce ? 0 : 0.1, ease }}
          >
          <div className="ms-pass-top">
            <span className="ms-pass-file">个人档案 / PROFILE</span>
            <span className="ms-pass-stamp" aria-hidden="true">{initial}</span>
          </div>
          <h2>{name || "还没有称呼"}</h2>
          <p className="ms-pass-goal">
            {goalLabels[draft.goal]} · 每周 {draft.days} 次 · {environmentLabels[draft.environment]}
          </p>
          <dl className="ms-pass-grid">
            <div><dt>身高</dt><dd>{draft.heightCm ? `${draft.heightCm} cm` : "—"}</dd></div>
            <div><dt>体重</dt><dd>{draft.weightKg ? `${draft.weightKg} kg` : "—"}</dd></div>
            <div><dt>目标体重</dt><dd>{draft.targetWeightKg ? `${draft.targetWeightKg} kg` : "—"}</dd></div>
            <div><dt>饮食偏好</dt><dd>{dietLabels[draft.diet]}</dd></div>
          </dl>
          <div className="ms-pass-ticks">
            <div className="ms-ticks" aria-hidden="true">
              {Array.from({ length: completeness.total }, (_, index) => (
                <i key={index} className={index < completeness.filled ? "on" : ""} />
              ))}
            </div>
            <span>资料 {completeness.filled}/{completeness.total}</span>
          </div>
          <p className="ms-pass-foot">
            <ShieldCheck size={12} aria-hidden="true" />
            {hasStored ? "仅保存在本机浏览器" : "保存后只留在本机"}
          </p>
          </motion.aside>
        </div>
        <span className="ms-hero-glare" aria-hidden="true" />
        </motion.section>
      </div>

      {isDemo && (
        <p className="ms-notice" role="note">
          <Info size={14} aria-hidden="true" />
          当前填入的是演示资料，可以按自己的情况修改；保存后只留在本机，不会上传。
        </p>
      )}

      <div className="ms-workspace">
        <form className="ms-form" ref={formRef} onSubmit={submit} noValidate tabIndex={-1}>
          <div className="ms-form-head">
            <div>
              <h2>把你的情况写下来。</h2>
              <p>称呼必填；其余留空时，相关估算会显示“待补充”，不会用示例值补齐。保存后的资料只留在当前浏览器。</p>
            </div>
            <span className="ms-form-state">
              {hasStored ? `本机资料${savedMoment ? ` · ${savedMoment}` : ""}` : "尚未保存"}
            </span>
          </div>

          <section className="ms-form-section" aria-labelledby="ms-basic">
            <div className="ms-section-head">
              <h3 id="ms-basic"><span>01</span>先认识一下</h3>
              <p>这些只用于估算与生成结构</p>
            </div>
            <div className="ms-grid">
              <Field id="ms-name" label="称呼" hint="必填 · 最多 12 字" error={errors.name}>
                <input
                  className="ms-input"
                  id="ms-name"
                  value={draft.name}
                  maxLength={12}
                  autoComplete="nickname"
                  placeholder="怎么称呼你"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "ms-name-error" : undefined}
                  onChange={(event) => update("name", event.target.value)}
                />
              </Field>

              <fieldset className="ms-choice-set">
                <legend>性别</legend>
                <div className="ms-choice ms-choice-compact">
                  {genderOptions.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={draft.gender === option.value}
                        onChange={() => update("gender", option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                <p className="ms-field-hint">只用于热量公式，可选择不透露。</p>
              </fieldset>

              <Field id="ms-age" label="年龄" hint="14–90 岁" error={errors.age}>
                <input
                  className="ms-input"
                  id="ms-age"
                  type="number"
                  inputMode="numeric"
                  min={14}
                  max={90}
                  value={draft.age}
                  placeholder="例如 28"
                  aria-invalid={Boolean(errors.age)}
                  aria-describedby={errors.age ? "ms-age-error" : undefined}
                  onChange={(event) => update("age", event.target.value)}
                />
              </Field>

              <Field id="ms-height" label="身高" hint="cm" error={errors.heightCm}>
                <input
                  className="ms-input"
                  id="ms-height"
                  type="number"
                  inputMode="decimal"
                  min={130}
                  max={220}
                  step="0.1"
                  value={draft.heightCm}
                  placeholder="例如 168"
                  aria-invalid={Boolean(errors.heightCm)}
                  aria-describedby={errors.heightCm ? "ms-height-error" : undefined}
                  onChange={(event) => update("heightCm", event.target.value)}
                />
              </Field>

              <Field id="ms-weight" label="当前体重" hint="kg" error={errors.weightKg}>
                <input
                  className="ms-input"
                  id="ms-weight"
                  type="number"
                  inputMode="decimal"
                  min={35}
                  max={200}
                  step="0.1"
                  value={draft.weightKg}
                  placeholder="例如 63.4"
                  aria-invalid={Boolean(errors.weightKg)}
                  aria-describedby={errors.weightKg ? "ms-weight-error" : undefined}
                  onChange={(event) => update("weightKg", event.target.value)}
                />
              </Field>

              <Field id="ms-target-weight" label="目标体重" hint="kg · 可留空" error={errors.targetWeightKg}>
                <input
                  className="ms-input"
                  id="ms-target-weight"
                  type="number"
                  inputMode="decimal"
                  min={35}
                  max={200}
                  step="0.1"
                  value={draft.targetWeightKg}
                  placeholder="例如 58"
                  aria-invalid={Boolean(errors.targetWeightKg)}
                  aria-describedby={errors.targetWeightKg ? "ms-target-weight-error" : undefined}
                  onChange={(event) => update("targetWeightKg", event.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="ms-form-section" aria-labelledby="ms-rhythm">
            <div className="ms-section-head">
              <h3 id="ms-rhythm"><span>02</span>你的节奏</h3>
              <p>按你现在能做到的来</p>
            </div>
            <div className="ms-choice-grid">
              <ChoiceGroup legend="健康目标" value={draft.goal} options={goalOptions} onChange={(value) => update("goal", value)} />
              <ChoiceGroup legend="日常活动" value={draft.activity} options={activityOptions} onChange={(value) => update("activity", value)} />
            </div>
            <div className="ms-choice-grid">
              <ChoiceGroup legend="每周训练次数" value={draft.days} options={dayOptions} onChange={(value) => update("days", value)} />
              <ChoiceGroup legend="每次训练时长" value={draft.minutes} options={minuteOptions} onChange={(value) => update("minutes", value)} />
            </div>
            <ChoiceGroup legend="训练环境" value={draft.environment} options={environmentOptions} onChange={(value) => update("environment", value)} wide />
          </section>

          <section className="ms-form-section" aria-labelledby="ms-table">
            <div className="ms-section-head">
              <h3 id="ms-table"><span>03</span>餐桌与预算</h3>
              <p>计划会按偏好换菜</p>
            </div>
            <ChoiceGroup legend="饮食偏好" value={draft.diet} options={dietOptions} onChange={(value) => update("diet", value)} wide />
            <div className="ms-grid ms-grid-spaced">
              <Field id="ms-budget" label="每日饮食预算" hint="元 / 天 · 可留空" error={errors.budget}>
                <input
                  className="ms-input"
                  id="ms-budget"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={1000}
                  value={draft.budget}
                  placeholder="例如 60"
                  aria-invalid={Boolean(errors.budget)}
                  aria-describedby={errors.budget ? "ms-budget-error" : undefined}
                  onChange={(event) => update("budget", event.target.value)}
                />
              </Field>
              <Field id="ms-avoid" label="需要避开的食物" hint="可留空" error={errors.avoid}>
                <input
                  className="ms-input"
                  id="ms-avoid"
                  value={draft.avoid}
                  maxLength={80}
                  placeholder="例如：花生、乳糖、海鲜"
                  aria-invalid={Boolean(errors.avoid)}
                  aria-describedby={errors.avoid ? "ms-avoid-error" : undefined}
                  onChange={(event) => update("avoid", event.target.value)}
                />
              </Field>
            </div>
          </section>

          <div className="ms-form-foot">
            <p className={`ms-status ${status.kind}`} role="status" aria-live="polite">
              {status.kind === "saved"
                ? <Check size={13} aria-hidden="true" />
                : status.kind === "error"
                  ? <CircleAlert size={13} aria-hidden="true" />
                  : <ShieldCheck size={13} aria-hidden="true" />}
              <span>{status.text || "资料只保存在本机浏览器，不会上传服务器。"}</span>
            </p>
            <div className="ms-form-actions">
              {isDemo && <button type="button" className="ms-ghost-btn" onClick={fillDemo}>填入演示资料</button>}
              <button type="button" className="ms-ghost-btn" onClick={resetDraft}>撤销修改</button>
              <GlitchButton type="submit">保存并生成计划 <ArrowRight size={15} aria-hidden="true" /></GlitchButton>
            </div>
          </div>
        </form>

        <aside className="ms-aside" aria-label="参考范围与目标">
          <section className="ms-ref" aria-labelledby="ms-ref-heading">
            <div className="ms-ref-head">
              <h3 id="ms-ref-heading">这些数字，先当参考。</h3>
              <span>按当前填写</span>
            </div>
            <div className="ms-ref-list">
              <div className="ms-ref-row">
                <span className="ms-ref-label"><span>BMI</span><small>只按身高与体重计算</small></span>
                <strong className="ms-ref-value">{bmi !== null ? bmi.toFixed(1) : "—"}<small>kg/m²</small></strong>
              </div>
              <div className="ms-ref-row">
                <span className="ms-ref-label"><span>每日热量</span><small>按活动与目标估算</small></span>
                <strong className="ms-ref-value">
                  {targets ? `${targets.calorieLow.toLocaleString("zh-CN")}–${targets.calorieHigh.toLocaleString("zh-CN")}` : "—"}
                  <small>kcal</small>
                </strong>
              </div>
              <div className="ms-ref-row">
                <span className="ms-ref-label"><span>蛋白质</span><small>按体重估算</small></span>
                <strong className="ms-ref-value">
                  {targets ? `${targets.proteinLow}–${targets.proteinHigh}` : "—"}
                  <small>g</small>
                </strong>
              </div>
              <div className="ms-ref-row">
                <span className="ms-ref-label"><span>饮水</span><small>按体重估算</small></span>
                <strong className="ms-ref-value">
                  {targets ? `${targets.waterLow.toFixed(1)}–${targets.waterHigh.toFixed(1)}` : "—"}
                  <small>L</small>
                </strong>
              </div>
            </div>
            <p className={`ms-ref-note${targets ? "" : " is-alert"}`}>{targetsNote}</p>
          </section>

          <section className="ms-goal-card" aria-label="目标线">
            <span className="ms-goal-label">目标线</span>
            <p>{goalLine ?? "还没有填写目标体重。先把目标写下来，或者先保持现在的节奏。"}</p>
            <div className="ms-goal-meta">
              <span>{goalLabels[draft.goal]}</span>
              <span>{draft.days} 次 / 周</span>
              <span>{environmentLabels[draft.environment]}</span>
            </div>
            <button type="button" onClick={() => setPage("coach")}>
              和健康搭子聊聊 <ArrowRight size={13} aria-hidden="true" />
            </button>
          </section>
        </aside>
      </div>

      <div className="ms-plans-wrap" ref={plansRef} tabIndex={-1} aria-label="按当前资料生成的饮食与运动计划">
        <header className="ms-plans-head">
          <h2>饮食与运动，先各排一版。</h2>
          <p>以下内容按当前填写即时生成；保存后资料留在本机。它们是一般结构，不是个体营养或医疗处方。</p>
        </header>

        <div className="ms-plans">
          <Reveal>
            <article className="ms-plan">
              <div className="ms-plan-head">
                <div>
                  <h3>一日四餐，留出替换的余地。</h3>
                  <p>{dietLabels[draft.diet]} · {draft.budget.trim() ? `预算约 ¥${draft.budget.trim()}/天` : "未填写预算"}</p>
                </div>
                <span className="ms-plan-tag">按当前资料</span>
              </div>
              <ol className="ms-meals">
                {plans.diet.meals.map((meal) => (
                  <li className="ms-meal" key={meal.time}>
                    <div className="ms-meal-when">
                      <b>{meal.time}</b>
                      <span>{meal.label}</span>
                    </div>
                    <div className="ms-meal-what">
                      <strong>{meal.title}</strong>
                      <p>{meal.detail}</p>
                      <small><RotateCw size={11} aria-hidden="true" />{meal.swap}</small>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="ms-plan-notes">
                <p><CircleAlert size={13} aria-hidden="true" />{plans.diet.avoidNote}</p>
                <p><Wallet size={13} aria-hidden="true" />{plans.diet.budgetNote}</p>
              </div>
              <div className="ms-plan-foot">
                <button type="button" className="ms-plan-cta" onClick={() => setPage("plans")}>
                  打开完整饮食计划 <ArrowRight size={14} aria-hidden="true" />
                </button>
                <button type="button" className="ms-plan-ghost" onClick={() => setPage("food")}>去记录一餐</button>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.06}>
            <article className="ms-plan">
              <div className="ms-plan-head">
                <div>
                  <h3>一周几次，先排进日历。</h3>
                  <p>
                    {environmentLabels[draft.environment]} · 每周 {plans.movement.sessionCount} 次 · 每次 {draft.minutes} 分钟
                    · 共约 {plans.movement.totalMinutes} 分钟
                  </p>
                </div>
                <span className="ms-plan-tag">按当前资料</span>
              </div>
              <div
                className="ms-week"
                role="img"
                aria-label={`每周安排：${plans.movement.sessions.map((session) => `${session.day}${session.title}${session.minutes}分钟`).join("，")}`}
              >
                {plans.movement.week.map((day) => (
                  <div key={day.label} className={`ms-week-day ${day.session ? "has" : "rest"}`} aria-hidden="true">
                    <span>{day.short}</span>
                    <i />
                    <small>{day.session ? `${day.session.minutes}′` : "·"}</small>
                  </div>
                ))}
              </div>
              <ul className="ms-sessions">
                {plans.movement.sessions.map((session) => (
                  <li key={`${session.day}-${session.title}`}>
                    <span className="ms-session-day">{session.day}</span>
                    <div><strong>{session.title}</strong><p>{session.focus}</p></div>
                    <span className="ms-session-min">{session.minutes}′</span>
                  </li>
                ))}
              </ul>
              <div className="ms-plan-notes">
                <p><Info size={13} aria-hidden="true" />以无痛范围为限，状态一般时先减量。这里只做计划提醒，不记录心率或完成情况。</p>
              </div>
              <div className="ms-plan-foot">
                <button type="button" className="ms-plan-cta" onClick={() => setPage("exercise")}>
                  打开完整运动计划 <ArrowRight size={14} aria-hidden="true" />
                </button>
                <button type="button" className="ms-plan-ghost" onClick={() => setPage("coach")}>问问怎么开始</button>
              </div>
            </article>
          </Reveal>
        </div>
      </div>

      <Reveal>
        <section className="ms-boundary" aria-labelledby="ms-boundary-title">
          <div className="ms-boundary-copy">
            <h2 id="ms-boundary-title">这份计划是怎么来的。</h2>
            <p>它按固定的营养与训练结构，从你填写的信息里取值；不调用 AI，也不做疾病风险判断。</p>
          </div>
          <dl className="ms-boundary-list">
            <div>
              <dt>只算结构</dt>
              <dd>热量与蛋白质是估算区间，不是个体营养处方。有慢性病、孕期、进食障碍风险或正在调整用药，请先咨询医生或营养师。</dd>
            </div>
            <div>
              <dt>只存本机</dt>
              <dd>资料保存在浏览器 localStorage；清除站点数据、换设备或换浏览器后不会自动同步。</dd>
            </div>
            <div>
              <dt>不猜缺失</dt>
              <dd>没有填写的数字保持“待补充”，不会用演示数据补齐，也不会生成健康分或疾病风险。</dd>
            </div>
          </dl>
        </section>
      </Reveal>
    </div>
  );
}

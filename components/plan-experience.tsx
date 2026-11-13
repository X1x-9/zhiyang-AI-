"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock3,
  Dumbbell,
  Footprints,
  HeartPulse,
  Info,
  Leaf,
  RotateCw,
  Salad,
  ShieldCheck,
  Sun,
  Timer,
  Utensils,
  Wind,
} from "lucide-react";
import { Reveal } from "@/components/experience";
import { GlitchButton } from "@/components/glitch-button";
import type { DashboardData } from "@/lib/dashboard";
import { useHealthStore } from "@/stores/health-store";

const ease = [0.22, 1, 0.36, 1] as const;

type PlanKind = "diet" | "exercise";

const planMeals = [
  {
    time: "08:00",
    label: "早餐",
    title: "燕麦酸奶碗",
    tags: ["10 分钟", "无需开火"],
    swap: "无糖酸奶可以换成豆浆，燕麦换成全麦面包；蛋白质和主食都还在。",
  },
  {
    time: "12:30",
    label: "午餐",
    title: "番茄鸡胸杂粮饭",
    tags: ["外食友好", "少油"],
    swap: "外食可以选少油盖饭，再加一份青菜；不必追求和示例完全一致。",
  },
  {
    time: "16:00",
    label: "加餐",
    title: "无糖豆浆和坚果",
    tags: ["一小把", "不饿可省"],
    swap: "坚果一小把即可；不方便时，用一杯无糖酸奶替换也可以。",
  },
  {
    time: "19:00",
    label: "晚餐",
    title: "虾仁豆腐",
    tags: ["20 分钟", "清淡"],
    swap: "虾仁可以换成鱼或鸡蛋，豆腐可以换成其他豆制品。",
  },
] as const;

const flexNotes = [
  {
    icon: Utensils,
    title: "外食",
    copy: "先找一份蛋白质和一份蔬菜，主食按饥饿感决定留多少。",
  },
  {
    icon: Sun,
    title: "聚餐",
    copy: "把这顿当成生活的一部分；下一餐回到平时的结构，不用补偿。",
  },
  {
    icon: Clock3,
    title: "没时间",
    copy: "酸奶、水果、全麦面包也能凑成一顿；先保证有东西吃。",
  },
] as const;

const weekPlan = [
  { label: "周一", short: "一", title: "随意走", minutes: 0, tone: "rest" },
  { label: "周二", short: "二", title: "力量 A", minutes: 25, tone: "session" },
  { label: "周三", short: "三", title: "休息", minutes: 0, tone: "rest" },
  { label: "周四", short: "四", title: "快走 + 活动度", minutes: 20, tone: "session" },
  { label: "周五", short: "五", title: "休息", minutes: 0, tone: "rest" },
  { label: "周六", short: "六", title: "力量 B", minutes: 25, tone: "session" },
  { label: "周日", short: "日", title: "轻松走", minutes: 0, tone: "rest" },
] as const;

const sessions = [
  {
    id: "strength-a",
    day: "周二",
    title: "力量 A",
    subtitle: "下肢与核心",
    minutes: 25,
    focus: "椅子深蹲 · 臀桥 · 死虫",
    steps: [
      { label: "热身", minutes: 5, text: "原地走、踝关节绕环，让身体微微发热。" },
      { label: "主训练", minutes: 15, text: "椅子深蹲 2×10、臀桥 2×12、死虫 2×8；组间休息 45 秒。" },
      { label: "收尾", minutes: 5, text: "小腿和大腿前侧拉伸，呼吸放慢。" },
    ],
    easier: "状态一般时，深蹲扶着椅背，臀桥减到 8 次；动作以无痛范围为限。",
  },
  {
    id: "walk",
    day: "周四",
    title: "快走 + 活动度",
    subtitle: "心肺与恢复",
    minutes: 20,
    focus: "快走 · 肩颈活动 · 髋部拉伸",
    steps: [
      { label: "热身", minutes: 3, text: "慢走 3 分钟，让呼吸和脚步找到节奏。" },
      { label: "快走", minutes: 12, text: "走到能说短句、但不想唱歌的速度。" },
      { label: "收尾", minutes: 5, text: "肩颈绕环、髋部拉伸，各做几次。" },
    ],
    easier: "拆成两次 10 分钟也可以；下雨就在室内原地走。",
  },
  {
    id: "strength-b",
    day: "周六",
    title: "力量 B",
    subtitle: "上肢与背部",
    minutes: 25,
    focus: "墙面俯卧撑 · 划船 · 平板支撑",
    steps: [
      { label: "热身", minutes: 5, text: "手臂绕环、原地踏步，让肩背醒过来。" },
      { label: "主训练", minutes: 15, text: "墙面俯卧撑 2×10、弹力带划船 2×12、跪姿平板 2×20 秒。" },
      { label: "收尾", minutes: 5, text: "胸肩拉伸，慢慢呼吸。" },
    ],
    easier: "没有弹力带时，用毛巾做等长划船；平板改成跪姿或靠墙站立收腹。",
  },
] as const;

const intensityLevels = [
  {
    label: "轻松",
    short: "能完整聊天",
    copy: "呼吸平稳，能完整说一句话，还能哼歌。适合恢复日，或者刚开始的那几周。",
  },
  {
    label: "适中",
    short: "能说短句",
    copy: "呼吸变快，但还能说短句。大多数日常训练可以停在这里，不需要每次都练到极限。",
  },
  {
    label: "有点挑战",
    short: "只能说几个词",
    copy: "需要专注，只能说几个词。每周少量出现就好；状态一般时，主动降一级。",
  },
] as const;

const exerciseNotes = [
  {
    icon: Timer,
    title: "忙的时候",
    copy: "把 25 分钟拆成两段 10 分钟，中间隔开也算，不用一次做完。",
  },
  {
    icon: Footprints,
    title: "久坐之后",
    copy: "起身走两分钟、接杯水，比等一整块时间更现实。",
  },
  {
    icon: Wind,
    title: "错过一次",
    copy: "不用补课。下一次按原节奏继续，计划不需要完美执行。",
  },
] as const;

function shanghaiWeekdayIndex() {
  const label = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", weekday: "short" }).format(new Date());
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(label);
}

function todayLabel(index: number) {
  return index >= 0 ? `今天 · ${weekPlan[index]?.label ?? ""}` : "今天";
}

export function PlanSwitcher({ page }: { page: "plans" | "exercise" }) {
  const setPage = useHealthStore((state) => state.setPage);
  const items = [
    { id: "plans", label: "饮食计划", caption: "餐盘与替换思路", icon: Salad },
    { id: "exercise", label: "运动计划", caption: "每周节奏与强度", icon: Dumbbell },
  ] as const;

  return (
    <div className="pp-switch-wrap">
      <nav className="pp-switcher" aria-label="计划类型">
        {items.map(({ id, label, caption, icon: Icon }) => {
          const active = page === id;
          return (
            <button
              type="button"
              key={id}
              className={`pp-switch ${active ? "active" : ""}`}
              onClick={() => setPage(id)}
              aria-current={active ? "page" : undefined}
            >
              <span className="pp-switch-icon"><Icon size={17} aria-hidden="true" /></span>
              <span className="pp-switch-copy"><strong>{label}</strong><small>{caption}</small></span>
            </button>
          );
        })}
      </nav>
      <p className="pp-switch-note"><Info size={12} aria-hidden="true" /> 两套都是示例结构，不会自动改写你的目标</p>
    </div>
  );
}

function useTilt(ref: React.RefObject<HTMLDivElement | null>) {
  const reduce = useReducedMotion();

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce || event.pointerType !== "mouse") return;
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    element.style.setProperty("--tilt-x", `${(-py * 9).toFixed(2)}deg`);
    element.style.setProperty("--tilt-y", `${(px * 11).toFixed(2)}deg`);
  }

  function onPointerLeave() {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--tilt-x", "0deg");
    element.style.setProperty("--tilt-y", "0deg");
  }

  return { onPointerMove, onPointerLeave };
}

function PlanParticles({ tone }: { tone: "light" | "dark" }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const surface = canvas;
    const ctx = context;

    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = reduceQuery.matches;
    let frame = 0;
    let running = false;
    let width = 0;
    let height = 0;
    const colors = tone === "dark"
      ? [[244, 239, 218], [210, 183, 132], [255, 255, 255]]
      : [[114, 143, 115], [183, 121, 63], [255, 255, 255]];

    function makeSprite(color: number[]) {
      const sprite = document.createElement("canvas");
      sprite.width = 64;
      sprite.height = 64;
      const brush = sprite.getContext("2d");
      if (!brush) return sprite;
      const [r, g, b] = color;
      const gradient = brush.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, .9)`);
      gradient.addColorStop(0.38, `rgba(${r}, ${g}, ${b}, .32)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      brush.fillStyle = gradient;
      brush.fillRect(0, 0, 64, 64);
      return sprite;
    }

    const sprites = colors.map(makeSprite);
    type Mote = { x: number; y: number; r: number; speed: number; drift: number; phase: number; alpha: number; sprite: HTMLCanvasElement };
    let motes: Mote[] = [];

    function seed() {
      const count = Math.max(14, Math.min(46, Math.round(width / 26)));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.8 + Math.random() * 2.2,
        speed: 0.12 + Math.random() * 0.34,
        drift: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.18 + Math.random() * 0.42,
        sprite: sprites[Math.floor(Math.random() * sprites.length)],
      }));
    }

    function draw(time: number) {
      ctx.clearRect(0, 0, width, height);
      for (const mote of motes) {
        const x = mote.x + Math.sin(time * 0.0004 + mote.phase) * mote.drift * 18;
        const rawY = mote.y - ((time * 0.012 * mote.speed) % (height + 40));
        const y = rawY < -20 ? rawY + height + 40 : rawY;
        const size = mote.r * 6;
        ctx.globalAlpha = mote.alpha;
        ctx.drawImage(mote.sprite, x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    }

    function loop(time: number) {
      if (!running) return;
      draw(time);
      frame = requestAnimationFrame(loop);
    }

    function start() {
      cancelAnimationFrame(frame);
      if (document.hidden) return;
      running = true;
      if (reduce) {
        draw(0);
        running = false;
        return;
      }
      frame = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    function resize() {
      const rect = surface.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      start();
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    }, { threshold: 0 });
    const resizeObserver = new ResizeObserver(resize);
    const onVisibility = () => { if (document.hidden) stop(); else start(); };
    const onReducedMotion = () => { reduce = reduceQuery.matches; start(); };

    observer.observe(surface);
    resizeObserver.observe(surface);
    document.addEventListener("visibilitychange", onVisibility);
    reduceQuery.addEventListener("change", onReducedMotion);
    resize();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduceQuery.removeEventListener("change", onReducedMotion);
    };
  }, [tone]);

  return <canvas ref={canvasRef} className="pp-particles" aria-hidden="true" />;
}

function AnimatedNumber({ value }: { value: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!inView || reduce) return;
    let frame = 0;
    const started = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduce, value]);

  return <span ref={ref}>{(reduce ? value : display).toLocaleString("zh-CN")}</span>;
}

function PlateInstrument() {
  const sceneRef = React.useRef<HTMLDivElement>(null);
  const tilt = useTilt(sceneRef);

  return (
    <div className="pp-instrument-float">
      <div className="pp-plate-scene" ref={sceneRef} {...tilt}>
        <div className="pp-plate-card">
          <span className="pp-plate-glass" aria-hidden="true" />
          <span className="pp-plate-orbit orbit-a" aria-hidden="true" />
          <span className="pp-plate-orbit orbit-b" aria-hidden="true" />
          <div className="pp-plate-body">
            <div className="pp-instrument-head"><span>一餐的样子</span><span className="pp-mini-tag">示例</span></div>
            <div className="pp-plate-disc" role="img" aria-label="示例餐盘结构：一半蔬菜，四分之一蛋白质，四分之一主食">
              <span className="pp-plate-half" aria-hidden="true">½</span>
              <span className="pp-plate-half-label" aria-hidden="true">蔬菜</span>
            </div>
            <div className="pp-plate-legend" aria-hidden="true">
              <span><i className="veg" />蔬菜 ½</span>
              <span><i className="protein" />蛋白质 ¼</span>
              <span><i className="staple" />主食 ¼</span>
            </div>
            <p className="pp-instrument-note">份量按自己的饥饿感调整</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeekInstrument() {
  const [today, setToday] = React.useState(-1);
  const sceneRef = React.useRef<HTMLDivElement>(null);
  const tilt = useTilt(sceneRef);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setToday(shanghaiWeekdayIndex()));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="pp-instrument-float">
      <div className="pp-week-scene" ref={sceneRef} {...tilt}>
        <div className="pp-week-card">
          <span className="pp-plate-glass" aria-hidden="true" />
          <div className="pp-week-body">
            <div className="pp-instrument-head"><span>本周节奏</span><span className="pp-mini-tag">示例</span></div>
            <div
              className="pp-week-mini"
              role="img"
              aria-label="示例周节奏：周二力量二十五分钟，周四快走与活动度二十分钟，周六力量二十五分钟。"
            >
              {weekPlan.map((day, index) => (
                <div key={day.label} className={`pp-week-mini-day ${day.tone === "session" ? "has-session" : ""} ${index === today ? "is-today" : ""}`} aria-hidden="true">
                  <span>{day.short}</span>
                  <i />
                  <small>{day.minutes > 0 ? `${day.minutes}′` : "·"}</small>
                </div>
              ))}
            </div>
            <div className="pp-week-mini-foot"><Footprints size={13} aria-hidden="true" /> 3 次活动 · 约 70 分钟 · {todayLabel(today)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanHero({ kind, data }: { kind: PlanKind; data?: DashboardData }) {
  const reduce = useReducedMotion();
  const diet = kind === "diet";
  const goal = data?.calorieGoal ?? null;
  const macros = data?.macros ?? null;

  return (
    <section className={`pp-hero pp-hero-${kind}`} aria-labelledby={`pp-${kind}-title`}>
      <div className="pp-hero-media">
        <Image
          src={diet ? "/images/plan-diet-hero.webp" : "/images/plan-exercise-hero.webp"}
          alt={diet ? "木质餐桌上摆放着燕麦鸡蛋碗、酸奶、牛油果和蔬菜的早餐" : "清晨湖畔的木栈道上，一名男子正在做弓步拉伸"}
          fill
          sizes="(max-width: 800px) 100vw, 1150px"
          priority
        />
      </div>
      <div className="pp-hero-veil" aria-hidden="true" />
      <PlanParticles tone={diet ? "light" : "dark"} />
      <div className="pp-hero-inner">
        <motion.div
          className="pp-hero-copy"
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.7, ease }}
        >
          <div className="pp-kicker">
            <span>{diet ? "DIET" : "MOVEMENT"}</span>
            <i aria-hidden="true" />
            <span>{diet ? "饮食计划" : "运动计划"}</span>
            <span className="pp-mini-tag">{diet ? "示例结构" : "示例安排"}</span>
          </div>
          <h1 id={`pp-${kind}-title`}>{diet ? "吃得刚刚好，\n比吃得完美更重要。" : "把训练，\n放回风里。"}</h1>
          <p className="pp-hero-lede">
            {diet
              ? "先保证每一餐有蛋白质、蔬菜和主食，再谈份量和细节。时间和搭配都可以换。"
              : "每周三次、每次约二十五分钟的示例节奏：力量、快走和拉伸轮流出现。忙的时候，走十分钟也算。"}
          </p>
          <div className="pp-meta-row">
            {diet ? (
              <>
                <span className="pp-chip">{goal !== null ? <>每日参考 <strong>{goal.toLocaleString("zh-CN")}</strong> kcal</> : "参考目标未接入"}</span>
                <span className="pp-chip">{macros ? <>蛋白质 <strong>{macros.protein.goal}</strong> g</> : "营养明细未接入"}</span>
                <span className="pp-chip">{data && data.mealsToday > 0 ? <>今天已记录 <strong>{data.mealsToday}</strong> 餐</> : "今天还没有记录"}</span>
              </>
            ) : (
              <>
                <span className="pp-chip">示例 · 每周 3 次</span>
                <span className="pp-chip">示例 · 每次约 25 分钟</span>
                <span className="pp-chip">示例 · 居家无器械</span>
              </>
            )}
          </div>
        </motion.div>
        <motion.div
          className="pp-hero-instrument"
          initial={reduce ? false : { opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduce ? 0 : 0.85, delay: reduce ? 0 : 0.14, ease }}
        >
          {diet ? <PlateInstrument /> : <WeekInstrument />}
        </motion.div>
      </div>
      <p className="pp-hero-credit">
        {diet ? "照片为氛围示意；餐盘结构与餐次均为示例，不是个体营养处方。" : "照片为氛围示意；训练安排为示例，不记录心率或动作数据。"}
      </p>
    </section>
  );
}

function SectionHead({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <header className="pp-sec-head">
      <div className="pp-sec-eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </header>
  );
}

function MacroRow({ label, value, goal, tone }: { label: string; value: number; goal: number; tone: string }) {
  const percent = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div className="pp-macro">
      <div className="pp-macro-head"><span>{label}</span><b>{Math.round(value)} <small>/ {goal} g</small></b></div>
      <div className="pp-macro-track" role="progressbar" aria-label={`${label}参考目标进度`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <span className={tone} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MealCard({ meal }: { meal: (typeof planMeals)[number] }) {
  const [flipped, setFlipped] = React.useState(false);
  return (
    <button
      type="button"
      className={`pp-meal ${flipped ? "flipped" : ""}`}
      aria-expanded={flipped}
      onClick={() => setFlipped((value) => !value)}
    >
      <span className="pp-meal-inner">
        <span className="pp-meal-face pp-meal-front" aria-hidden={flipped}>
          <span className="pp-meal-top"><span className="pp-meal-time">{meal.time}</span><span className="pp-meal-badge">示例</span></span>
          <span className="pp-meal-kicker">{meal.label}</span>
          <strong>{meal.title}</strong>
          <span className="pp-meal-tags">{meal.tags.map((tag) => <span key={tag}>{tag}</span>)}</span>
          <span className="pp-meal-hint">翻看替换思路 <RotateCw size={12} aria-hidden="true" /></span>
        </span>
        <span className="pp-meal-face pp-meal-back" aria-hidden={!flipped}>
          <span className="pp-meal-back-top"><span>替换思路 · 示例</span><RotateCw size={12} aria-hidden="true" /></span>
          <span className="pp-meal-swap">{meal.swap}</span>
          <span className="pp-meal-hint">再点一下翻回来</span>
        </span>
      </span>
    </button>
  );
}

function DietTargets({ data, loading }: { data?: DashboardData; loading: boolean }) {
  const goal = data?.calorieGoal ?? null;
  const macros = data?.macros ?? null;
  return (
    <Reveal>
      <section className="pp-section" aria-labelledby="pp-target-title">
        <SectionHead
          eyebrow="参考目标"
          title="参考目标，不是考试分数。"
          copy="目标只用来给日常一个方向；今天记录了多少，就按多少看。缺失的数据不会用示例补齐。"
        />
        <div className="pp-target-card">
          <div className="pp-target-main">
            <span className="pp-target-label">每日参考热量</span>
            <div className="pp-target-number">
              {goal !== null ? <><AnimatedNumber value={goal} /><em>kcal</em></> : <span aria-label="目标未接入">—</span>}
            </div>
            <p className="pp-target-source">
              {loading ? "正在读取目标…" : goal === null ? "目标还没有接入" : data?.demo ? "演示目标 · 只用于展示结构" : "当前参考目标 · 不是个体处方"}
            </p>
            <div className="pp-target-today">
              {data && data.mealsToday > 0
                ? <>今天已确认 <strong>{data.calories.toLocaleString("zh-CN")}</strong> kcal · {data.mealsToday} 餐</>
                : loading ? "正在读取今日记录…" : "今天还没有已确认的餐食记录"}
            </div>
          </div>
          <div className="pp-target-macros">
            {macros ? (
              <>
                <MacroRow label="蛋白质" value={macros.protein.consumed} goal={macros.protein.goal} tone="protein" />
                <MacroRow label="碳水" value={macros.carbs.consumed} goal={macros.carbs.goal} tone="carbs" />
                <MacroRow label="脂肪" value={macros.fat.consumed} goal={macros.fat.goal} tone="fat" />
              </>
            ) : (
              <div className="pp-macro-empty">
                <Info size={16} aria-hidden="true" />
                <p>蛋白质、碳水、脂肪的明细还没有接入，这里只展示热量参考。没有的数据保持空白。</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function DietPlanMeals() {
  return (
    <Reveal>
      <section className="pp-section" aria-labelledby="pp-meals-title">
        <SectionHead
          eyebrow="一日节奏"
          title="一日四餐，留出替换的余地。"
          copy="时间是示例，按自己的作息平移；每一餐都有蛋白质、蔬菜和主食的思路。"
        />
        <div className="pp-meal-grid">
          {planMeals.map((meal) => <MealCard meal={meal} key={meal.time} />)}
        </div>
        <p className="pp-section-note">翻卡内容是搭配示例，不是个体营养处方；份量按自己的情况调整。</p>
      </section>
    </Reveal>
  );
}

function DietFlex() {
  return (
    <Reveal>
      <section className="pp-section" aria-labelledby="pp-flex-title">
        <SectionHead
          eyebrow="留出弹性"
          title="计划要能落地，才值得坚持。"
          copy="外食、聚餐、没时间，都是真实生活的一部分。以下是一般搭配建议，不是个体营养处方。"
        />
        <div className="pp-flex-grid">
          {flexNotes.map(({ icon: Icon, title, copy }) => (
            <article className="pp-flex-card" key={title}>
              <span className="pp-flex-icon"><Icon size={17} aria-hidden="true" /></span>
              <div><h3>{title}</h3><p>{copy}</p></div>
              <small>一般搭配建议</small>
            </article>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

function HonestyPanel() {
  const setPage = useHealthStore((state) => state.setPage);
  return (
    <Reveal>
      <section className="pp-dark pp-honest" aria-labelledby="pp-honest-title">
        <div className="pp-dark-copy">
          <div className="pp-sec-eyebrow">计划的边界</div>
          <h2 id="pp-honest-title">这份示例，不会替你做决定。</h2>
          <p>它只展示结构，没有根据你的真实记录自动生成，也不会悄悄改变目标。目标范围需要结合身高、体重、活动量和医生建议确定；这里不做个体医疗营养处方。</p>
        </div>
        <div className="pp-dark-actions">
          <GlitchButton tone="cream" className="pp-dark-glitch" onClick={() => setPage("coach")}>和健康搭子讨论 <ArrowRight size={16} aria-hidden="true" /></GlitchButton>
          <button type="button" className="pp-cta-ghost" onClick={() => setPage("food")}>回到餐食记录</button>
        </div>
      </section>
    </Reveal>
  );
}

export function DietPlan({ data, loading }: { data?: DashboardData; loading: boolean }) {
  return (
    <div className="pp-page">
      <PlanHero kind="diet" data={data} />
      <DietTargets data={data} loading={loading} />
      <DietPlanMeals />
      <DietFlex />
      <HonestyPanel />
    </div>
  );
}

function ExerciseWeek({ today }: { today: number }) {
  return (
    <Reveal>
      <section className="pp-section" aria-labelledby="pp-week-title">
        <SectionHead
          eyebrow="每周节奏"
          title="一周三次，留出恢复的空白。"
          copy="示例安排，不代表已经完成；今天的状态比表格更重要。"
        />
        <div className="pp-week-panel">
          <div className="pp-week-rail">
            {weekPlan.map((day, index) => (
              <div key={day.label} className={`pp-week-cell ${day.tone === "session" ? "has-session" : "rest"} ${index === today ? "is-today" : ""}`}>
                <div className="pp-week-day">
                  {day.label}
                  {index === today && <span className="pp-week-today-flag">今天</span>}
                </div>
                <div className="pp-week-title">{day.title}</div>
                <div className="pp-week-minutes">{day.minutes > 0 ? `${day.minutes} 分钟` : "—"}</div>
              </div>
            ))}
          </div>
          <div className="pp-week-foot">
            <span><i className="pp-legend-dot session" />示例活动</span>
            <span><i className="pp-legend-dot rest" />休息或散步</span>
            <span className="pp-week-caption">3 次活动 · 约 70 分钟 · 不代表已完成</span>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function SessionDeck() {
  const [active, setActive] = React.useState(0);
  const tabsRef = React.useRef<Array<HTMLButtonElement | null>>([]);
  const reduce = useReducedMotion();
  const session = sessions[active];

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowRight" && event.key !== "ArrowUp" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const next = (active + direction + sessions.length) % sessions.length;
    setActive(next);
    tabsRef.current[next]?.focus();
  }

  return (
    <Reveal>
      <section className="pp-section" aria-labelledby="pp-session-title">
        <SectionHead
          eyebrow="一次训练"
          title="一次 25 分钟，怎么排。"
          copy="动作和次数都是示例，以无痛范围为限；状态一般时，先减量再谈坚持。"
        />
        <div className="pp-deck">
          <div className="pp-deck-tabs" role="tablist" aria-label="示例训练课" aria-orientation="vertical" onKeyDown={onKeyDown}>
            {sessions.map((item, index) => (
              <button
                type="button"
                key={item.id}
                ref={(element) => { tabsRef.current[index] = element; }}
                role="tab"
                id={`pp-session-tab-${item.id}`}
                aria-selected={index === active}
                aria-controls={`pp-session-panel-${item.id}`}
                tabIndex={index === active ? 0 : -1}
                className={`pp-session-tab ${index === active ? "active" : ""}`}
                onClick={() => setActive(index)}
              >
                <span className="pp-session-day">{item.day} · 示例</span>
                <strong>{item.title}</strong>
                <small>{item.subtitle} · {item.minutes} 分钟</small>
              </button>
            ))}
          </div>
          <div
            className="pp-session-panel"
            role="tabpanel"
            id={`pp-session-panel-${session.id}`}
            aria-labelledby={`pp-session-tab-${session.id}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={session.id}
                initial={reduce ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 1 } : { opacity: 0, x: -8 }}
                transition={{ duration: reduce ? 0 : 0.28, ease }}
              >
                <div className="pp-session-head">
                  <div>
                    <span className="pp-mini-tag">示例 · {session.day}</span>
                    <h3>{session.title}<small>{session.subtitle}</small></h3>
                  </div>
                  <span className="pp-session-time"><Timer size={13} aria-hidden="true" />约 {session.minutes} 分钟</span>
                </div>
                <p className="pp-session-focus">{session.focus}</p>
                <ol className="pp-steps">
                  {session.steps.map((step, index) => (
                    <li key={step.label}>
                      <span className="pp-step-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>{step.label} · {step.minutes} 分钟</strong><p>{step.text}</p></div>
                    </li>
                  ))}
                </ol>
                <div className="pp-easier"><Wind size={15} aria-hidden="true" /><p><strong>状态一般时</strong>{session.easier}</p></div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function IntensityMeter() {
  const [level, setLevel] = React.useState(1);
  const reduce = useReducedMotion();

  return (
    <Reveal>
      <section className="pp-section" aria-labelledby="pp-intensity-title">
        <SectionHead
          eyebrow="强度感受"
          title="强度，用说话测试来定。"
          copy="不用盯着心率数字，先用能不能说话来估一个大概。"
        />
        <div className="pp-intensity">
          <div className="pp-intensity-scale" role="group" aria-label="选择强度感受示例">
            {intensityLevels.map((item, index) => (
              <button
                type="button"
                key={item.label}
                className={`pp-intensity-btn ${index === level ? "active" : ""}`}
                aria-pressed={index === level}
                onClick={() => setLevel(index)}
              >
                {index === level && (
                  <motion.span
                    layoutId="pp-intensity-pill"
                    className="pp-intensity-pill"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                    aria-hidden="true"
                  />
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="pp-intensity-copy" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={level}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 1 } : { opacity: 0, y: -5 }}
                transition={{ duration: reduce ? 0 : 0.22, ease }}
              >
                <strong>{intensityLevels[level].short}</strong>
                <p>{intensityLevels[level].copy}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="pp-intensity-note"><Info size={13} aria-hidden="true" /> 有心肺疾病、正在康复或孕期，请先遵医嘱；这里的强度只是日常参考。</p>
        </div>
      </section>
    </Reveal>
  );
}

function ExerciseLife() {
  return (
    <Reveal>
      <section className="pp-section" aria-labelledby="pp-life-title">
        <SectionHead
          eyebrow="真实生活"
          title="让计划，跟得上真实生活。"
          copy="不用把每一次都练成“标准答案”；能继续下去的安排，才是好安排。"
        />
        <div className="pp-life-grid">
          {exerciseNotes.map(({ icon: Icon, title, copy }) => (
            <article className="pp-life-card" key={title}>
              <span className="pp-flex-icon"><Icon size={17} aria-hidden="true" /></span>
              <div><h3>{title}</h3><p>{copy}</p></div>
            </article>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

function SafetyPanel() {
  const setPage = useHealthStore((state) => state.setPage);
  return (
    <Reveal>
      <section className="pp-dark pp-safety" aria-labelledby="pp-safety-title">
        <div className="pp-dark-copy">
          <div className="pp-sec-eyebrow">安全边界</div>
          <h2 id="pp-safety-title">先听身体的，再听计划的。</h2>
          <p>本页只做计划提醒，不记录心率、动作或完成情况。任何动作都以无痛范围为限；不舒服时，停下来比完成计划更重要。</p>
          <div className="pp-safety-list">
            <div className="pp-safety-item">
              <HeartPulse size={15} aria-hidden="true" />
              <div><strong>立即停下</strong><p>胸痛、眩晕、异常气促或心悸时，停止活动，必要时就医。</p></div>
            </div>
            <div className="pp-safety-item">
              <ShieldCheck size={15} aria-hidden="true" />
              <div><strong>先问专业人士</strong><p>伤病恢复期、孕期、慢性病或正在调整用药，先咨询医生或康复师。</p></div>
            </div>
          </div>
        </div>
        <div className="pp-dark-actions">
          <GlitchButton tone="cream" className="pp-dark-glitch" onClick={() => setPage("coach")}>和健康搭子聊聊 <ArrowRight size={16} aria-hidden="true" /></GlitchButton>
          <span className="pp-dark-foot"><Check size={13} aria-hidden="true" /> 一般活动建议，不替代医疗或康复指导</span>
        </div>
      </section>
    </Reveal>
  );
}

export function ExercisePlan({ data }: { data?: DashboardData; loading?: boolean }) {
  const [today, setToday] = React.useState(-1);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setToday(shanghaiWeekdayIndex()));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="pp-page">
      <PlanHero kind="exercise" data={data} />
      <ExerciseWeek today={today} />
      <SessionDeck />
      <IntensityMeter />
      <ExerciseLife />
      <SafetyPanel />
      <p className="pp-endnote">
        <Leaf size={12} aria-hidden="true" /> 智养 AI · 示例计划 · 今天做到一点点，就已经在往前。
      </p>
    </div>
  );
}

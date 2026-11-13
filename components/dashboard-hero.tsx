"use client";

import * as React from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import {
  Beef,
  Camera,
  ChevronDown,
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  LayoutGrid,
  Leaf,
  Nut,
  Scale,
  UserRound,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { GlitchButton } from "@/components/glitch-button";
import type { DashboardData } from "@/lib/dashboard";

const ease = [0.22, 1, 0.36, 1] as const;

type SliceTarget = "food" | "plans" | "exercise" | "review" | "profile" | "hydration";

type DashboardHeroProps = {
  data: DashboardData;
  water: number;
  percent: number;
  onRecord: () => void;
  onProfile: () => void;
  onNavigate: (page: "food" | "plans" | "exercise" | "review" | "profile") => void;
  onHydration: () => void;
};

type Slice = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  empty: boolean;
  target: SliceTarget;
  targetLabel: string;
};

function buildSlices(data: DashboardData, water: number, percent: number): Slice[] {
  const macros = data.macros;
  return [
    { key: "meals", icon: UtensilsCrossed, label: "餐食", value: `${data.mealsToday} 餐`, empty: data.mealsToday === 0, target: "food", targetLabel: "饮食记录" },
    { key: "protein", icon: Beef, label: "蛋白质", value: macros ? `${macros.protein.consumed} g` : "未接入", empty: !macros, target: "plans", targetLabel: "饮食计划" },
    { key: "water", icon: Droplets, label: "饮水", value: `${water.toLocaleString("zh-CN")} ml`, empty: false, target: "hydration", targetLabel: "今日饮水记录" },
    { key: "calories", icon: Flame, label: "热量进度", value: `${percent}%`, empty: false, target: "plans", targetLabel: "饮食计划" },
    { key: "space", icon: UserRound, label: "我的空间", value: "健康画像", empty: false, target: "profile", targetLabel: "我的空间" },
    { key: "workout", icon: Dumbbell, label: "训练安排", value: data.workout ? `${data.workout.durationMinutes} 分钟` : "未安排", empty: !data.workout, target: "exercise", targetLabel: "运动计划" },
    { key: "carbs", icon: Wheat, label: "碳水", value: macros ? `${macros.carbs.consumed} g` : "未接入", empty: !macros, target: "plans", targetLabel: "饮食计划" },
    { key: "fat", icon: Nut, label: "脂肪", value: macros ? `${macros.fat.consumed} g` : "未接入", empty: !macros, target: "plans", targetLabel: "饮食计划" },
    { key: "weight", icon: Scale, label: "体重", value: data.weightKg === null ? "未记录" : `${data.weightKg.toFixed(1)} kg`, empty: data.weightKg === null, target: "review", targetLabel: "每周复盘" },
  ];
}

type TodayMosaicProps = Pick<DashboardHeroProps, "data" | "water" | "percent" | "onNavigate" | "onHydration">;

function TodayMosaic({ data, water, percent, onNavigate, onHydration }: TodayMosaicProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const gridId = React.useId();
  const slices = buildSlices(data, water, percent);
  const waterText = water.toLocaleString("zh-CN");
  const waterGoal = data.waterGoal.toLocaleString("zh-CN");

  return (
    <div className={`hero-art${open ? " is-open" : ""}`}>
      <motion.div
        className="hero-art-decor"
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.74, delay: reduce ? 0 : 0.08, ease }}
      >
        <span className="hero-aura" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
        <span className="hero-art-halo" aria-hidden="true" />
        <div className="hero-mosaic">
          <span className="hero-mosaic-back" aria-hidden="true" />
          <div className="hero-mosaic-grid" id={gridId} role="group" aria-label="今日健康切片">
            {slices.map((slice, index) => {
              const Icon = slice.icon;
              return (
                <button
                  key={slice.key}
                  type="button"
                  className={`hero-mosaic-tile${slice.empty ? " is-empty" : ""}`}
                  style={{
                    "--slice-x": `${(index % 3) * 50}%`,
                    "--slice-y": `${Math.floor(index / 3) * 50}%`,
                    "--slice-index": index,
                  } as React.CSSProperties}
                  aria-label={`${slice.label} ${slice.value}，前往${slice.targetLabel}`}
                  onClick={() => {
                    if (slice.target === "hydration") onHydration();
                    else onNavigate(slice.target);
                  }}
                >
                  <span className="hero-mosaic-label">
                    <span className="hero-mosaic-icon"><Icon size={12} /></span>
                    <span><small>{slice.label}</small><strong>{slice.value}</strong></span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <span className="hero-chip hero-chip-a" aria-hidden="true">
          <span className="chip-icon"><Leaf size={13} /></span>
          今天已记录 <strong>{data.mealsToday}</strong> 餐
        </span>
        <span className="hero-chip hero-chip-b" aria-hidden="true">
          <span className="chip-icon"><Droplets size={13} /></span>
          <strong>{waterText}</strong> / {waterGoal} ml
        </span>
        <span className="hero-petal hero-petal-a" aria-hidden="true" />
        <span className="hero-petal hero-petal-b" aria-hidden="true" />
      </motion.div>
      <button
        type="button"
        className="hero-mosaic-trigger"
        aria-expanded={open}
        aria-controls={gridId}
        onClick={() => setOpen((value) => !value)}
      >
        <LayoutGrid size={13} aria-hidden="true" />
        <span>{open ? "收起今日切片" : "展开今日切片"}</span>
        <ChevronDown size={12} aria-hidden="true" className={`hero-mosaic-caret${open ? " is-open" : ""}`} />
      </button>
    </div>
  );
}

function Macro({ label, value, goal }: { label: string; value: number; goal: number }) {
  const percent = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div className="macro-line">
      <span>{label}</span>
      <div className="macro-track" role="progressbar" aria-label={`${label}目标完成度`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="macro-fill" style={{ width: `${percent}%` }} />
      </div>
      <b>{Math.round(value)} / {goal}g</b>
    </div>
  );
}

function HeroEnergy({ data, percent }: { data: DashboardData; percent: number }) {
  const reduce = useReducedMotion();
  const ringDeg = Math.min(100, percent) * 3.6;
  const remaining = data.calorieGoal - data.calories;
  const macros = data.macros;

  return (
    <motion.div
      className="hero-energy"
      aria-label="今天的饮食节奏"
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.58, delay: 0.08, ease }}
    >
      <div className="energy-body">
        <div className="ring" role="img" aria-label={`今日热量目标完成 ${percent}%`} style={{ background: `conic-gradient(#6e9678 0deg ${ringDeg}deg, #eaf0e9 ${ringDeg}deg 360deg)` }}>
          <div className="ring-center"><strong>{percent}<small>%</small></strong></div>
        </div>
        <div className="energy-side">
          <div className="energy-copy">
            <div className="kcal-label">已记录热量</div>
            <div className="kcal-number">
              <b>{data.calories.toLocaleString("zh-CN")}</b>
              <span>kcal</span>
              <em>/ {data.calorieGoal.toLocaleString("zh-CN")} kcal</em>
            </div>
            <div className="remain">
              {remaining >= 0
                ? <>距离参考目标还有 <strong>{remaining.toLocaleString("zh-CN")} kcal</strong></>
                : <>已超过参考目标 <strong>{Math.abs(remaining).toLocaleString("zh-CN")} kcal</strong>，明天慢慢调整</>}
            </div>
          </div>
          {macros && (
            <div className="macro-list">
              <Macro label="蛋白质" value={macros.protein.consumed} goal={macros.protein.goal} />
              <Macro label="碳水" value={macros.carbs.consumed} goal={macros.carbs.goal} />
              <Macro label="脂肪" value={macros.fat.consumed} goal={macros.fat.goal} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardHero({ data, water, percent, onRecord, onProfile, onNavigate, onHydration }: DashboardHeroProps) {
  const reduce = useReducedMotion();
  const stageRef = React.useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 170, damping: 20, mass: 0.6 });
  const rotateY = useSpring(0, { stiffness: 170, damping: 20, mass: 0.6 });
  const scale = useSpring(1, { stiffness: 200, damping: 24 });
  const titleText = `${data.greeting}，${data.displayName}`;
  const titleChars = Array.from(titleText);

  const handleTilt = (event: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (reduce || event.pointerType !== "mouse" || !stage) return;
    if (!window.matchMedia("(hover: hover) and (min-width: 961px)").matches) return;
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-y * 3.4);
    rotateY.set(x * 4.2);
    scale.set(1.008);
    stage.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
    stage.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
    stage.dataset.tilting = "true";
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
    if (stageRef.current) delete stageRef.current.dataset.tilting;
  };

  return (
    <div
      ref={stageRef}
      className="hero-stage"
      onPointerMove={handleTilt}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
    >
      <motion.section
        className="hero-garden"
        aria-labelledby="hero-greeting"
        style={reduce ? undefined : { rotateX, rotateY, scale }}
      >
        <span className="hero-glass" aria-hidden="true" />
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, ease }}
        >
          <div className="hero-eyebrow">
            <span className="hero-live"><i aria-hidden="true" />{data.demo ? "演示空间" : "今日空间"}</span>
            <span>{data.dateLabel}</span>
          </div>
          <h1 id="hero-greeting" className="hero-title-3d" aria-label={`${titleText}。`}>
            {titleChars.map((char, index) => (
              <span
                key={`${char}-${index}`}
                className="hero-char"
                style={{ "--char-index": index } as React.CSSProperties}
                aria-hidden="true"
              >
                {char}
              </span>
            ))}
            <span
              className="hero-char hero-char-dot"
              style={{ "--char-index": titleChars.length } as React.CSSProperties}
              aria-hidden="true"
            >
              。
            </span>
          </h1>
          <p className="hero-sub">今天不用做到完美，照顾好自己就很好。</p>
          <div className="hero-actions">
            <GlitchButton className="hero-record" onClick={onRecord}><Camera size={15} aria-hidden="true" /> 记下这一餐</GlitchButton>
            <button type="button" className="hero-profile-link" onClick={onProfile}>看看健康画像 <ChevronRight size={14} /></button>
          </div>
          <div className="hero-facts" aria-label="今日记录概览">
            <div className="hero-fact"><b>{data.mealsToday}</b><span>餐已确认</span></div>
            <div className="hero-fact"><b>{water.toLocaleString("zh-CN")}</b><span>ml / {data.waterGoal.toLocaleString("zh-CN")} ml 饮水</span></div>
            <div className="hero-fact"><b>{percent}%</b><span>热量目标进度</span></div>
          </div>
        </motion.div>

        <HeroEnergy data={data} percent={percent} />
        <TodayMosaic data={data} water={water} percent={percent} onNavigate={onNavigate} onHydration={onHydration} />
        <span className="hero-glare" aria-hidden="true" />
      </motion.section>
    </div>
  );
}
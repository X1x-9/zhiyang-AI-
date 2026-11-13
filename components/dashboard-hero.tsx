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
  Moon,
  Nut,
  Scale,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { GlitchButton } from "@/components/glitch-button";
import type { DashboardData } from "@/lib/dashboard";

type SliceTarget = "food" | "plans" | "exercise" | "review" | "hydration";

type DashboardHeroProps = {
  data: DashboardData;
  water: number;
  percent: number;
  onRecord: () => void;
  onProfile: () => void;
  onNavigate: (page: "food" | "plans" | "exercise" | "review") => void;
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

const ease = [0.22, 1, 0.36, 1] as const;

function buildSlices(data: DashboardData, water: number, percent: number): Slice[] {
  const macros = data.macros;
  return [
    { key: "meals", icon: UtensilsCrossed, label: "餐食", value: `${data.mealsToday} 餐`, empty: data.mealsToday === 0, target: "food", targetLabel: "饮食记录" },
    { key: "protein", icon: Beef, label: "蛋白质", value: macros ? `${macros.protein.consumed} g` : "未接入", empty: !macros, target: "plans", targetLabel: "饮食计划" },
    { key: "water", icon: Droplets, label: "饮水", value: `${water.toLocaleString("zh-CN")} ml`, empty: false, target: "hydration", targetLabel: "今日饮水记录" },
    { key: "calories", icon: Flame, label: "热量进度", value: `${percent}%`, empty: false, target: "plans", targetLabel: "饮食计划" },
    { key: "sleep", icon: Moon, label: "睡眠", value: "未接入", empty: true, target: "review", targetLabel: "每周复盘" },
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

        <TodayMosaic data={data} water={water} percent={percent} onNavigate={onNavigate} onHydration={onHydration} />
        <span className="hero-glare" aria-hidden="true" />
      </motion.section>
    </div>
  );
}

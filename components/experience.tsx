"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Activity, ArrowUp, ChevronRight, Coffee, Droplets, Heart, Info, Moon, NotebookPen, Pause, Play, Salad, Sparkles, Sun, Utensils, Wind, X } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduce ? 0 : 0.58, delay: reduce ? 0 : delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 130, damping: 25, restDelta: 0.001 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

export function HamsterLoader({ label, size = "md" }: { label: string; size?: "md" | "compact" | "mini" }) {
  const modifier = size === "md" ? "" : ` hamster-loader--${size}`;
  return (
    <div className={`hamster-loader${modifier}`} role="status" aria-live="polite">
      <div className="wheel-and-hamster" aria-hidden="true">
        <div className="wheel" />
        <div className="hamster">
          <div className="hamster__body">
            <div className="hamster__head">
              <div className="hamster__ear" />
              <div className="hamster__eye" />
              <div className="hamster__nose" />
            </div>
            <div className="hamster__limb hamster__limb--fr" />
            <div className="hamster__limb hamster__limb--fl" />
            <div className="hamster__limb hamster__limb--br" />
            <div className="hamster__limb hamster__limb--bl" />
            <div className="hamster__tail" />
          </div>
        </div>
        <div className="spoke" />
      </div>
      <p>{label}</p>
    </div>
  );
}

export function GrowingLoader({ label }: { label: string }) {
  return <HamsterLoader label={label} />;
}

const tips = [
  { tag: "饮食", title: "先看颜色，再看份量", body: "一餐里有几种颜色，通常更容易吃得丰富；份量以自己舒服为准。", icon: Utensils, theme: "sage" },
  { tag: "活动", title: "把久坐切成小段", body: "坐一阵子就起身接杯水、走两分钟，比一次性猛练更容易坚持。", icon: Activity, theme: "apricot" },
  { tag: "节奏", title: "给饱腹感一点时间", body: "吃到不饿、还没撑的时候停一停，身体会慢慢告诉你“够了”。", icon: Heart, theme: "rose" },
  { tag: "饮水", title: "让水杯留在视线里", body: "看不见就容易忘记。把水放在手边，每次经过喝一小口。", icon: Droplets, theme: "sky" },
  { tag: "休息", title: "睡前留十分钟空白", body: "关掉屏幕，做一点安静的收尾，让今天慢慢结束。", icon: Moon, theme: "lilac" },
  { tag: "早餐", title: "给早餐留十分钟", body: "哪怕只是酸奶加水果，坐下来吃完，也比边走边解决更从容。", icon: Coffee, theme: "apricot" },
  { tag: "日照", title: "白天出门走一走", body: "自然光帮身体分辨白天和夜晚；午饭后绕一小圈就很好。", icon: Sun, theme: "rose" },
  { tag: "放松", title: "慢慢呼吸三次", body: "把呼气放长一点，肩膀松下来。不是任务，只是给自己一个缓冲。", icon: Wind, theme: "sky" },
  { tag: "记录", title: "记录是为了看见", body: "不用追求满格，也不用每天完美。记录只是帮你了解自己的节奏。", icon: NotebookPen, theme: "lilac" },
  { tag: "蔬菜", title: "这周多试一种蔬菜", body: "不用大改菜单，在常吃的菜里加一样新的，就算一次小尝试。", icon: Salad, theme: "sky" },
] as const;

export function HealthTipsCarousel() {
  const [paused, setPaused] = React.useState(false);
  const count = tips.length;
  const angle = 360 / count;

  return (
    <section className="tips-section" aria-labelledby="tips-title">
      <div className="tips-head">
        <div>
          <div className="tips-eyebrow"><Sparkles size={13} /> 轻提示</div>
          <h2 id="tips-title">今天，给自己一个小提醒</h2>
          <p>10 条一般生活建议，慢慢转；悬停或点暂停，可以停下来读。不替代个体化指导。</p>
        </div>
        <div className="tips-controls">
          <button
            type="button"
            className={`tips-toggle ${paused ? "is-paused" : ""}`}
            aria-label={paused ? "继续自动旋转" : "暂停自动旋转"}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
            {paused ? "继续旋转" : "暂停旋转"}
          </button>
        </div>
      </div>

      <div className="tips-stage">
        <div className={`tips-ring ${paused ? "is-paused" : ""}`}>
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <article
                className={`tip-3d theme-${tip.theme}`}
                key={tip.title}
                style={{ transform: `rotateY(${index * angle}deg) translateZ(var(--tip-radius))` }}
              >
                <div className="tip-top">
                  <span className="tip-icon"><Icon size={20} strokeWidth={2} /></span>
                  <span className="tip-tag">{tip.tag}</span>
                </div>
                <h3>{tip.title}</h3>
                <p>{tip.body}</p>
                <div className="tip-foot">
                  <Info size={11} aria-hidden="true" />
                  <span>一般生活建议</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Mascot() {
  return (
    <svg viewBox="0 0 64 64" className="mascot-svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mascot-body" x1="14" y1="10" x2="50" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#eaf3e2" />
          <stop offset="1" stopColor="#c6dcb9" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="59.5" rx="16" ry="3.2" fill="#355b4614" />
      <path d="M32 9c0-4 3-7 8-8 1 5-3 8-8 8Z" fill="#6f9676" />
      <path d="M32 9c0-3-2-6-6-7 0 4 2 7 6 7Z" fill="#8fb08a" />
      <path d="M32 9C19.3 9 9 19.3 9 32c0 13.3 10.3 23 23 23s23-9.7 23-23C55 19.3 44.7 9 32 9Z" fill="url(#mascot-body)" />
      <circle cx="24" cy="31" r="2.3" fill="#355b46" />
      <circle cx="40" cy="31" r="2.3" fill="#355b46" />
      <circle cx="24.8" cy="30.2" r=".7" fill="#fff" />
      <circle cx="40.8" cy="30.2" r=".7" fill="#fff" />
      <circle cx="18.5" cy="37" r="3.1" fill="#d9a77e" opacity=".42" />
      <circle cx="45.5" cy="37" r="3.1" fill="#d9a77e" opacity=".42" />
      <path d="M27 38c2 2.6 8 2.6 10 0" fill="none" stroke="#355b46" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function FloatingCompanion({ hidden, onOpen }: { hidden: boolean; onOpen: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (hidden || dismissed) return;
    const timer = window.setTimeout(() => setOpen(true), 2400);
    return () => window.clearTimeout(timer);
  }, [hidden, dismissed]);

  React.useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setOpen(false);
      setDismissed(true);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [open]);

  const openCoach = () => {
    setDismissed(true);
    setOpen(false);
    onOpen();
  };

  if (hidden) return null;

  return (
    <div className="companion">
      {open && !dismissed && (
        <div className="companion-bubble" role="status">
          <button
            type="button"
            className="companion-close"
            aria-label="收起健康搭子的提示"
            onClick={() => {
              setOpen(false);
              setDismissed(true);
            }}
          >
            <X size={12} />
          </button>
          <strong>健康搭子在这儿</strong>
          <span>今天想先聊饮食，还是训练？</span>
          <button type="button" className="companion-cta" onClick={openCoach}>去聊聊 <ChevronRight size={12} /></button>
        </div>
      )}
      <button type="button" className="companion-button" aria-label="打开 AI 健康助手" onClick={openCoach}>
        <Mascot />
      </button>
    </div>
  );
}

export function BackToTop() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`back-to-top ${visible ? "visible" : ""}`}
      aria-label="回到顶部"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
    >
      <ArrowUp size={15} /><span>顶部</span>
    </button>
  );
}

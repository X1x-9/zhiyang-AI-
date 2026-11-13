"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Activity, ArrowUp, ChevronLeft, ChevronRight, Droplets, Heart, Moon, Sparkles, Utensils, X } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.58, delay, ease }}
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

export function GrowingLoader({ label }: { label: string }) {
  return (
    <div className="growing-loader" role="status" aria-live="polite">
      <span className="growing-sprout" aria-hidden="true"><i /><i /><i /></span>
      <p>{label}</p>
    </div>
  );
}

const tips = [
  { tag: "饮食", title: "先看颜色，再看份量", body: "一餐里有几种颜色，通常更容易吃得丰富；份量以自己舒服为准。", icon: Utensils, theme: "sage" },
  { tag: "活动", title: "把久坐切成小段", body: "坐一阵子就起身接杯水、走两分钟，比一次性猛练更容易坚持。", icon: Activity, theme: "apricot" },
  { tag: "节奏", title: "给饱腹感一点时间", body: "吃到不饿、还没撑的时候停一停，身体会慢慢告诉你“够了”。", icon: Heart, theme: "rose" },
  { tag: "饮水", title: "让水杯留在视线里", body: "看不见就容易忘记。把水放在手边，每次经过喝一小口。", icon: Droplets, theme: "sky" },
  { tag: "休息", title: "睡前留十分钟空白", body: "关掉屏幕，做一点安静的收尾，让今天慢慢结束。", icon: Moon, theme: "lilac" },
] as const;

export function HealthTipsCarousel() {
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = tips.length;
  const angle = 360 / count;

  React.useEffect(() => {
    if (paused || reduce) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % count), 4800);
    return () => window.clearInterval(timer);
  }, [paused, reduce, count]);

  const go = (direction: number) => setActive((value) => (value + direction + count) % count);
  const current = tips[active];

  return (
    <section
      className="tips-section"
      aria-labelledby="tips-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="tips-head">
        <div>
          <div className="tips-eyebrow"><Sparkles size={13} /> 轻提示</div>
          <h2 id="tips-title">今天，给自己一个小提醒</h2>
          <p>转动卡片看看；这些只是一般生活建议，不替代个体化指导。</p>
        </div>
        <div className="tips-controls">
          <button type="button" className="tips-arrow" aria-label="上一条提示" onClick={() => go(-1)}><ChevronLeft size={16} /></button>
          <button type="button" className="tips-arrow" aria-label="下一条提示" onClick={() => go(1)}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="tips-stage">
        <div className="tips-ring" style={{ transform: `rotateY(${-active * angle}deg)` }}>
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            const isActive = index === active;
            return (
              <article
                className={`tip-3d theme-${tip.theme} ${isActive ? "is-active" : ""}`}
                key={tip.title}
                style={{ transform: `rotateY(${index * angle}deg) translateZ(var(--tip-radius))` }}
                aria-hidden={isActive ? undefined : true}
              >
                <span className="tip-orbit" aria-hidden="true" />
                <div className="tip-top">
                  <span className="tip-icon"><Icon size={18} /></span>
                  <span className="tip-tag">{tip.tag}</span>
                </div>
                <h3>{tip.title}</h3>
                <p>{tip.body}</p>
                <div className="tip-foot">
                  <span>{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
                  <span>轻提示 · 不替代个体建议</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="tips-dots" role="group" aria-label="切换健康小提示">
        {tips.map((tip, index) => (
          <button
            type="button"
            key={tip.title}
            className={`tips-dot ${index === active ? "active" : ""}`}
            aria-label={`查看第 ${index + 1} 条提示：${tip.title}`}
            aria-current={index === active ? "true" : undefined}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{current.tag}：{current.title}。{current.body}</p>
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

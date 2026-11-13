"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpRight } from "lucide-react";
import type { Page } from "@/stores/health-store";

type LandingSectionsProps = {
  onEnter: (page: Page) => void;
};

const modules = [
  { id: "module-food", page: "food", index: "01", label: "餐食记录" },
  { id: "module-plans", page: "plans", index: "02", label: "饮食计划" },
  { id: "module-exercise", page: "exercise", index: "03", label: "运动计划" },
  { id: "module-coach", page: "coach", index: "04", label: "AI 健康助手" },
  { id: "module-review", page: "review", index: "05", label: "每周复盘" },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

function useReveal() {
  const reduce = useReducedMotion();
  return React.useCallback(
    (delay = 0) => ({
      initial: { opacity: 0, y: 26 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0.3 } as const,
      transition: { duration: reduce ? 0 : 0.7, delay: reduce ? 0 : delay, ease },
    }),
    [reduce],
  );
}

function ModuleSection({
  meta,
  title,
  desc,
  points,
  cta,
  reverse,
  onEnter,
  children,
}: {
  meta: (typeof modules)[number];
  title: React.ReactNode;
  desc: string;
  points: string[];
  cta: string;
  reverse?: boolean;
  onEnter: LandingSectionsProps["onEnter"];
  children: React.ReactNode;
}) {
  const reveal = useReveal();

  return (
    <section
      className={`module-section${reverse ? " is-reverse" : ""}`}
      id={meta.id}
      aria-labelledby={`${meta.id}-title`}
    >
      <div className="module-shell">
        <div className="module-copy">
          <motion.p className="module-eyebrow" {...reveal(0)}>
            <span>{meta.index}</span>
            {meta.label}
          </motion.p>
          <motion.h2 className="module-title" id={`${meta.id}-title`} {...reveal(0.06)}>
            {title}
          </motion.h2>
          <motion.p className="module-desc" {...reveal(0.12)}>
            {desc}
          </motion.p>
          <motion.ul className="module-points" {...reveal(0.18)}>
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </motion.ul>
          <motion.div {...reveal(0.24)} className="module-action">
            <button type="button" className="module-cta" onClick={() => onEnter(meta.page)}>
              {cta}
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </motion.div>
        </div>
        <motion.div className="module-media" {...reveal(0.1)}>
          {children}
        </motion.div>
      </div>
    </section>
  );
}

export function LandingSections({ onEnter }: LandingSectionsProps) {
  const [active, setActive] = React.useState<string>("hero");
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const hero = document.querySelector(".landing-shell .hero-38");
    const targets = [hero, ...modules.map((item) => document.getElementById(item.id))].filter(
      (item): item is Element => item != null,
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!current) return;
        setActive(current.target.classList.contains("hero-38") ? "hero" : current.target.id);
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.25, 0.6, 1] },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    if (id === "hero") {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="landing-sections">
      <nav className="landing-rail" aria-label="首页分区导航">
        <button
          type="button"
          className={active === "hero" ? "is-active" : ""}
          onClick={() => scrollTo("hero")}
          aria-label="回到首屏"
        >
          <span className="rail-dot" aria-hidden="true" />
          <span className="rail-label">首页</span>
        </button>
        {modules.map((item) => (
          <button
            type="button"
            key={item.id}
            className={active === item.id ? "is-active" : ""}
            onClick={() => scrollTo(item.id)}
            aria-label={`跳到${item.label}`}
          >
            <span className="rail-dot" aria-hidden="true" />
            <span className="rail-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <p className="landing-scroll-hint" aria-hidden="true">
        <ArrowDown size={14} />
        向下浏览五个模块
      </p>

      <ModuleSection
        meta={modules[0]}
        title={<>先记下来，<br />再谈吃得好不好</>}
        desc="拍照或手动记录一餐，识别与份量估算只有在你确认之后，才会计入当天的营养统计。还没有记录的日子，就让它保持空白。"
        points={[
          "拍照识别后可以逐项修改，确认才入账",
          "每餐保留食物来源与估算依据",
          "缺记录不补推，统计只认真实记录",
        ]}
        cta="记录第一餐"
        onEnter={onEnter}
      >
        <div className="meal-collage">
          <figure className="media-frame meal-collage__main">
            <Image
              src="/images/landing/meal-arch.webp"
              alt="拱形壁龛里摆着沙拉、香草和橄榄油"
              fill
              sizes="(max-width: 960px) 82vw, 36vw"
            />
            <figcaption className="media-tag">确认后才计入</figcaption>
          </figure>
          <figure className="media-frame meal-collage__inset">
            <Image
              src="/images/landing/meal-bean.webp"
              alt="一碗豆类蔬菜沙拉，旁边是一杯柠檬水"
              fill
              sizes="(max-width: 960px) 46vw, 20vw"
            />
          </figure>
          <p className="media-credit">图片示意</p>
        </div>
      </ModuleSection>

      <ModuleSection
        meta={modules[1]}
        reverse
        title={<>计划跟着<br />你的记录走</>}
        desc="根据你保存的身体画像与已有餐食记录，生成每天的三餐安排；不合适就重新生成，上一版会保留下来，方便对比。"
        points={[
          "按画像与已有记录生成，不从模板照抄",
          "三餐结构与营养目标可以逐日回看",
          "重新生成保留上一版，方便比较",
        ]}
        cta="查看饮食计划"
        onEnter={onEnter}
      >
        <figure className="media-frame media-frame--wide">
          <Image
            src="/images/landing/diet-plan.webp"
            alt="奶油白桌面上的周计划手账与分格餐盘"
            fill
            sizes="(max-width: 960px) 88vw, 44vw"
          />
          <figcaption className="media-panel">
            <span className="media-panel__tag">计划结构示意</span>
            <ul>
              <li>早餐</li>
              <li>午餐</li>
              <li>晚餐</li>
            </ul>
            <span className="media-panel__note">按画像与已有记录生成</span>
          </figcaption>
        </figure>
      </ModuleSection>

      <ModuleSection
        meta={modules[2]}
        title={<>能坚持的安排，<br />才算安排</>}
        desc="结合你的日常活动与训练偏好安排运动，完成一格亮一格；状态不好时可以调整，不必硬撑。"
        points={[
          "按可用时间安排，不堆强度",
          "训练完成状态逐项勾选",
          "饮食与运动安排放在同一处",
        ]}
        cta="打开运动计划"
        onEnter={onEnter}
      >
        <figure className="media-frame media-frame--wide exercise-frame">
          <Image
            src="/images/landing/exercise-plan.webp"
            alt="浅木地板上的鼠尾草绿瑜伽垫、哑铃和跳绳"
            fill
            sizes="(max-width: 960px) 88vw, 44vw"
          />
          <figcaption className="exercise-tag">完成一格 · 亮一格</figcaption>
          <p className="exercise-note">训练状态由你勾选，未完成不代填</p>
        </figure>
      </ModuleSection>

      <ModuleSection
        meta={modules[3]}
        reverse
        title={<>有出处，<br />才敢给建议</>}
        desc="健康搭子会先检索已入库的膳食指南与研究文献，再结合你的记录回答；建议附上出处，不做诊断，也不替代医生。"
        points={[
          "先检索，再回答",
          "每条建议附上文献出处",
          "遇到就医问题会明确建议线下就诊",
        ]}
        cta="和健康搭子聊聊"
        onEnter={onEnter}
      >
        <div className="ls-coach-visual">
          <div className="ls-coach-orbit" aria-hidden="true" />
          <svg className="ls-coach-cubes" viewBox="0 0 150 150" aria-hidden="true">
            <g transform="translate(46 8)">
              <polygon points="0,18 34,0 68,18 34,36" fill="#e4ecdb" />
              <polygon points="0,18 34,36 34,72 0,54" fill="#9fb79a" />
              <polygon points="68,18 34,36 34,72 68,54" fill="#75927a" />
            </g>
            <g transform="translate(12 60)">
              <polygon points="0,18 34,0 68,18 34,36" fill="#f3ecd9" />
              <polygon points="0,18 34,36 34,72 0,54" fill="#d5b98b" />
              <polygon points="68,18 34,36 34,72 68,54" fill="#b9905d" />
            </g>
            <g transform="translate(80 80)">
              <polygon points="0,15 26,0 52,15 26,30" fill="#efe9da" />
              <polygon points="0,15 26,30 26,56 0,41" fill="#c3cfb8" />
              <polygon points="52,15 26,30 26,56 52,41" fill="#8aa78c" />
            </g>
          </svg>
          <div className="ls-coach-demo">
            <span className="ls-coach-demo__tag">对话示意</span>
            <p className="ls-coach-bubble ls-coach-bubble--user">今天晚餐怎么搭配？</p>
            <p className="ls-coach-bubble ls-coach-bubble--ai">
              建议先补一份深色蔬菜和一份优质蛋白，主食按今天的活动量来定。
            </p>
            <p className="ls-coach-demo__meta">回答附带出处 · 不做诊断</p>
          </div>
        </div>
      </ModuleSection>

      <ModuleSection
        meta={modules[4]}
        title={<>一周七帧，<br />记录过才亮</>}
        desc="把一周的饮食、运动和记录连续性放进七帧里。哪一天没有记录，就明确写未记录，不用估算把格子填满。"
        points={[
          "七帧对应一周七天",
          "只看真实记录与连续性",
          "没有数据时保留空白",
        ]}
        cta="查看本周复盘"
        onEnter={onEnter}
      >
        <div className="review-visual">
          <div className="review-orbit" aria-hidden="true" />
          <div className="review-head">
            <span className="review-title">本周七帧</span>
            <span className="review-tag">界面示意</span>
          </div>
          <ol className="review-frames" aria-label="一周七帧示意">
            {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
              <li key={day}>
                <span className="review-day">周{day}</span>
                <span className="review-state" aria-hidden="true">—</span>
                <span className="review-pip" aria-hidden="true" />
              </li>
            ))}
          </ol>
          <p className="review-caption">记录后点亮；没有记录就保持空白。</p>
        </div>
      </ModuleSection>

      <section className="landing-final" aria-labelledby="landing-final-title">
        <p className="landing-final__kicker">从今天开始</p>
        <h2 id="landing-final-title">先记一餐，<br />其余慢慢来。</h2>
        <div className="landing-final__actions">
          <button type="button" className="module-cta" onClick={() => onEnter("food")}>
            记录第一餐
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className="landing-final__ghost" onClick={() => onEnter("dashboard")}>
            先看看今日概览
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__brand">
          <span>智养<span className="landing-footer__ai">AI</span></span>
          <p>把身体的声音，放回生活里。</p>
        </div>
        <p className="landing-footer__note">仅提供日常健康管理建议，不替代专业医疗意见。</p>
        <button
          type="button"
          className="landing-footer__top"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
        >
          回到顶部
          <ArrowUp size={15} aria-hidden="true" />
        </button>
      </footer>
    </div>
  );
}
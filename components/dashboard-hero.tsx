"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, ChevronRight, Droplets, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardData } from "@/lib/dashboard";

type DashboardHeroProps = {
  data: DashboardData;
  water: number;
  percent: number;
  onRecord: () => void;
  onProfile: () => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function DashboardHero({ data, water, percent, onRecord, onProfile }: DashboardHeroProps) {
  const waterGoal = data.waterGoal.toLocaleString("zh-CN");
  const waterNow = water.toLocaleString("zh-CN");

  return (
    <section className="hero-garden" aria-labelledby="hero-greeting">
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
        <h1 id="hero-greeting">{data.greeting}，{data.displayName}<span>。</span></h1>
        <p className="hero-sub">今天不用做到完美，照顾好自己就很好。</p>
        <div className="hero-actions">
          <Button className="hero-record" onClick={onRecord}><Camera size={16} /> 记下这一餐</Button>
          <button type="button" className="hero-profile-link" onClick={onProfile}>看看健康画像 <ChevronRight size={14} /></button>
        </div>
        <div className="hero-facts" aria-label="今日记录概览">
          <div className="hero-fact"><b>{data.mealsToday}</b><span>餐已确认</span></div>
          <div className="hero-fact"><b>{waterNow}</b><span>ml / {waterGoal} ml 饮水</span></div>
          <div className="hero-fact"><b>{percent}%</b><span>热量目标进度</span></div>
        </div>
      </motion.div>

      <motion.div
        className="hero-art"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.74, delay: 0.08, ease }}
      >
        <span className="hero-art-halo" aria-hidden="true" />
        <div className="hero-art-frame">
          <Image
            src="/images/zhiyang-hero-garden.webp"
            alt=""
            width={900}
            height={900}
            sizes="(max-width: 800px) 86vw, 380px"
            priority
          />
        </div>
        <span className="hero-chip hero-chip-a">
          <span className="chip-icon"><Leaf size={13} /></span>
          今天已记录 <strong>{data.mealsToday}</strong> 餐
        </span>
        <span className="hero-chip hero-chip-b">
          <span className="chip-icon"><Droplets size={13} /></span>
          <strong>{waterNow}</strong> / {waterGoal} ml
        </span>
        <span className="hero-petal hero-petal-a" aria-hidden="true" />
        <span className="hero-petal hero-petal-b" aria-hidden="true" />
      </motion.div>
    </section>
  );
}

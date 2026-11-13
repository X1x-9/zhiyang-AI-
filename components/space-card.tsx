"use client";

import * as React from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  environmentLabels,
  goalLabels,
  spaceCompleteness,
  type SpaceProfile,
} from "@/lib/space";

type SpaceCardProps = {
  profile: SpaceProfile;
  saved: boolean;
  demo: boolean;
  active: boolean;
  onOpen: () => void;
};

export function SpaceCard({ profile, saved, demo, active, onOpen }: SpaceCardProps) {
  const completeness = spaceCompleteness(profile);
  const name = profile.name.trim();
  const initial = name.slice(0, 1) || "你";
  const source = saved ? "已保存到本机" : demo ? "演示资料 · 未保存" : "尚未填写";
  const missing = completeness.missing;
  const missingText = missing.length === 0
    ? "资料已齐，计划会跟着你的修改更新。"
    : `还差 ${missing.slice(0, 3).join("、")}${missing.length > 3 ? ` 等 ${missing.length} 项` : ""}`;
  const progress = Math.round((completeness.filled / completeness.total) * 100);

  return (
    <div className="space-dock">
      <div className="space-card">
        <button
          type="button"
          className="space-card-bar"
          onClick={onOpen}
          aria-current={active ? "page" : undefined}
          aria-label={`进入我的空间。${name || "尚未填写称呼"}，资料已填 ${completeness.filled} / ${completeness.total} 项，${source}`}
        >
          <span className="space-card-avatar" aria-hidden="true">{initial}</span>
          <span className="space-card-name">
            <strong>{name || "你的空间"}</strong>
            <small>{goalLabels[profile.goal]} · 资料 {completeness.filled}/{completeness.total}</small>
          </span>
          <ChevronRight size={15} className="space-card-chev" aria-hidden="true" />
        </button>

        <div className="space-card-panel">
          <div className="space-card-face">
            <span className="space-card-avatar space-card-avatar-lg" aria-hidden="true">{initial}</span>
            <span>
              <strong>{name || "还没有称呼"}</strong>
              <small>{source}</small>
            </span>
          </div>
          <p className="space-card-goal">
            {goalLabels[profile.goal]} · 每周 {profile.days} 次 · {environmentLabels[profile.environment]}
          </p>
          <div className="space-card-meter">
            <div><span>资料完整度</span><b>{completeness.filled}/{completeness.total}</b></div>
            <span
              className="space-card-track"
              role="progressbar"
              aria-label="资料完整度"
              aria-valuenow={completeness.filled}
              aria-valuemin={0}
              aria-valuemax={completeness.total}
            >
              <i style={{ width: `${progress}%` }} />
            </span>
          </div>
          <p className="space-card-missing">{missingText}</p>
          <button type="button" className="space-card-enter" onClick={onOpen}>
            进入我的空间 <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

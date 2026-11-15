"use client";

import * as React from "react";

const WAVE = "M0 236 C 210 150, 390 310, 720 214 C 1030 124, 1210 286, 1440 182 L 1440 320 L 0 320 Z";

export function TrainingStartButton({ onStart }: { onStart: () => void }) {
  const uid = React.useId().replace(/:/g, "");

  return (
    <button
      type="button"
      className="training-start"
      onClick={onStart}
      aria-label="开始训练，前往运动计划"
    >
      <svg className="training-start__waves" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-wave`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4f1ea" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#b7ccb9" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <g fill={`url(#${uid}-wave)`}>
          <path d={WAVE} opacity="0.2" transform="translate(0 70)" />
          <path d={WAVE} opacity="0.3" transform="translate(0 100)" />
          <path d={WAVE} opacity="0.42" transform="translate(0 130)" />
          <path d={WAVE} opacity="0.58" />
        </g>
      </svg>
      <svg className="training-start__crest" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-crest`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f4f1ea" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#dce9dc" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <path d={WAVE} fill={`url(#${uid}-crest)`} />
      </svg>
      <span className="training-start__shine" aria-hidden="true" />
      <span className="training-start__text training-start__text--idle" aria-hidden="true">开始训练</span>
      <span className="training-start__text training-start__text--hover" aria-hidden="true">去运动计划</span>
    </button>
  );
}

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowRight, UserRound, X } from "lucide-react";

export function ProfilePrompt({ onGo, onClose }: { onGo: () => void; onClose: () => void }) {
  const cardRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cardRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="profile-prompt-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="profile-prompt-stage" role="dialog" aria-modal="true" aria-labelledby="profile-prompt-title">
        <button
          ref={cardRef}
          type="button"
          className="profile-prompt-card"
          onClick={onGo}
          aria-label="去补充个人资料"
        >
          <span className="profile-prompt-overlay-circle" aria-hidden="true" />
          <span className="profile-prompt-circle" aria-hidden="true">
            <UserRound size={38} strokeWidth={1.8} />
          </span>
          <span className="profile-prompt-title" id="profile-prompt-title">快去填写个人资料，<br />生成你的专属计划吧</span>
          <span className="profile-prompt-cta">去补充资料 <ArrowRight size={14} aria-hidden="true" /></span>
        </button>
        <button type="button" className="profile-prompt-close" onClick={onClose} aria-label="稍后再说">
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body,
  );
}

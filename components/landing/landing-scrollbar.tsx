"use client";

import * as React from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function LandingScrollbar() {
  const railRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);
  const [active, setActive] = React.useState(false);
  const [metrics, setMetrics] = React.useState({ top: 0, height: 16 });

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const viewport = window.innerHeight;
        const total = Math.max(document.documentElement.scrollHeight, viewport);
        const maxScroll = total - viewport;
        const height = clamp((viewport / total) * 100, 9, 100);
        const top = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) * (100 - height) : 0;
        setMetrics({ top, height });
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, []);

  const scrollToPointer = (clientY: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const thumb = (rect.height * metrics.height) / 100;
    const usable = Math.max(1, rect.height - thumb);
    const y = clamp(clientY - rect.top - thumb / 2, 0, usable);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (y / usable) * maxScroll });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    setActive(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    scrollToPointer(event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) scrollToPointer(event.clientY);
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setActive(event.currentTarget.matches(":hover"));
  };

  return (
    <div
      ref={railRef}
      className={`landing-scrollbar${active ? " is-visible" : ""}`}
      aria-hidden="true"
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => { if (!dragging.current) setActive(false); }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <span
        className="landing-scrollbar__thumb"
        style={{ top: `${metrics.top}%`, height: `${metrics.height}%` }}
      />
    </div>
  );
}

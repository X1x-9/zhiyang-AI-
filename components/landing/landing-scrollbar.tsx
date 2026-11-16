"use client";

import * as React from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type Metrics = {
  maxScroll: number;
  railTop: number;
  railHeight: number;
  thumbHeight: number;
};

export function LandingScrollbar() {
  const railRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLSpanElement>(null);
  const dragging = React.useRef(false);
  const frame = React.useRef(0);
  const metrics = React.useRef<Metrics>({ maxScroll: 0, railTop: 0, railHeight: 0, thumbHeight: 0 });
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const paint = () => {
      frame.current = 0;
      const thumb = thumbRef.current;
      if (!thumb) return;
      const { railHeight, railTop } = metrics.current;
      const viewport = window.innerHeight;
      const total = Math.max(document.documentElement.scrollHeight, viewport);
      const thumbHeight = Math.max((viewport / total) * railHeight, railHeight * 0.09);
      const maxScroll = Math.max(0, total - viewport);
      metrics.current = { maxScroll, railTop, railHeight, thumbHeight };
      const progress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
      const offset = progress * Math.max(0, railHeight - thumbHeight);
      const height = `${thumbHeight}px`;
      if (thumb.style.height !== height) thumb.style.height = height;
      thumb.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const schedule = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(paint);
    };

    const measure = () => {
      const rect = rail.getBoundingClientRect();
      metrics.current = { ...metrics.current, railTop: rect.top, railHeight: rect.height };
      paint();
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  const scrollToPointer = (clientY: number) => {
    const { railTop, railHeight, thumbHeight, maxScroll } = metrics.current;
    const usable = Math.max(1, railHeight - thumbHeight);
    const y = clamp(clientY - railTop - thumbHeight / 2, 0, usable);
    window.scrollTo({ top: (y / usable) * maxScroll, behavior: "instant" });
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
      <span ref={thumbRef} className="landing-scrollbar__thumb" />
    </div>
  );
}
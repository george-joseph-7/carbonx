import { useEffect, useRef } from "react";
import { gsap } from "../lib/scroll";
import { sceneState } from "../three/sceneState";
import { prefersReducedMotion } from "../lib/device";

const A = ["VEGATHON 🌱", "SIGNALTHON 📡", "ELECTROTHON ⚡", "42 HOURS", "KOCHI"];
const B = ["BUILD", "INNOVATE", "ELECTRIFY", "CARBONX 2027", "HARDWARE FIRST"];

function Band({ items, dir, className }: { items: string[]; dir: 1 | -1; className: string }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let x = 0;
    let lastY = window.scrollY;
    let sign = 1;
    const reduced = prefersReducedMotion();
    const tick = (_t: number, dt: number) => {
      const y = window.scrollY;
      if (y !== lastY) sign = y > lastY ? 1 : -1;
      lastY = y;
      const speed = reduced ? 0 : (0.04 + Math.min(sceneState.velocity, 60) * 0.012) * dt;
      x -= speed * dir * sign;
      const half = el.scrollWidth / 2;
      if (half > 0) {
        if (x <= -half) x += half;
        if (x > 0) x -= half;
      }
      el.style.transform = `translate3d(${x}px,0,0)`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [dir]);
  const row = [...items, ...items, ...items];
  return (
    <div className={`band ${className}`}>
      <div className="band__track" ref={track}>
        {[...row, ...row].map((t, i) => (
          <span key={i} className="band__item">
            {t}
            <i aria-hidden="true">✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Two marquee bands crossing into an X — the hand-off from the hero into the story. */
export default function CrossBands() {
  return (
    <div className="bands" aria-hidden="true">
      <Band items={A} dir={1} className="band--a" />
      <Band items={B} dir={-1} className="band--b" />
    </div>
  );
}

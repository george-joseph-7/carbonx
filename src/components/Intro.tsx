import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, isLowPower } from "../lib/device";
import LogoMark from "./LogoMark";

interface Props {
  /** Fired when the site should start revealing underneath the intro */
  onReveal: () => void;
  /** Fired when the intro has fully faded and can unmount */
  onDone: () => void;
}

const BOOT_LINES = [
  "CARBONX://BOOT  v27.0",
  "allocating carbon lattice ........ OK",
  "tuning signal array .............. OK",
  "energizing circuits .............. OK",
  "seeding vegathon biome ........... OK",
  "ALL SYSTEMS NOMINAL",
];

// Timeline (ms)
const T_CONVERGE = 1500;
const T_FORMED = 3100;
const T_YEAR = 3900;
const T_EXIT = 5700;
const T_END = 6900;

type P = {
  sx: number; sy: number; // spawn
  tx: number; ty: number; // text target
  a: number; r: number; spd: number; // orbit
  delay: number; size: number; hue: number;
  vx: number; vy: number;
};

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export default function Intro({ onReveal, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<"boot" | "converge" | "formed" | "year" | "exit">("boot");
  const [pct, setPct] = useState(0);
  const [lines, setLines] = useState(0);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    if (reduced) {
      setPhase("year");
      const a = window.setTimeout(() => {
        setPhase("exit");
        onReveal();
      }, 900);
      const b = window.setTimeout(onDone, 1500);
      skipRef.current = () => {
        onReveal();
        onDone();
      };
      return () => {
        clearTimeout(a);
        clearTimeout(b);
      };
    }

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const low = isLowPower();
    const dpr = Math.min(window.devicePixelRatio, low ? 1.5 : 2);
    let W = 0;
    let H = 0;
    let particles: P[] = [];
    let raf = 0;
    let start = performance.now();
    let offset = 0; // used by skip
    let revealed = false;
    let finished = false;
    let lastPhase = "boot";
    let lastPct = -1;
    let lastLines = -1;
    const bolts: { pts: [number, number][]; born: number; hue: number }[] = [];
    let nextBolt = T_CONVERGE;

    const buildTargets = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const off = document.createElement("canvas");
      const fontSize = Math.min(W * 0.155, H * 0.3, 260);
      off.width = W;
      off.height = H;
      const o = off.getContext("2d")!;
      o.fillStyle = "#fff";
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.font = `900 ${fontSize}px Unbounded, "Arial Black", sans-serif`;
      // squeeze if too wide
      const measured = o.measureText("CARBONX").width;
      const actual = measured > W * 0.9 ? (fontSize * W * 0.9) / measured : fontSize;
      o.font = `900 ${actual}px Unbounded, "Arial Black", sans-serif`;
      // lets the DOM layers (logo, year, tagline) hug the particle word at any size
      rootRef.current?.style.setProperty("--word", `${actual}px`);
      o.fillText("CARBONX", W / 2, H / 2);
      const data = o.getImageData(0, 0, W, H).data;
      const gap = Math.max(3, Math.round(fontSize / (low ? 26 : 42)));
      const targets: [number, number][] = [];
      for (let y = 0; y < H; y += gap)
        for (let x = 0; x < W; x += gap) if (data[(y * W + x) * 4 + 3] > 128) targets.push([x, y]);

      const extra = low ? 150 : 420; // ambient dust that never lands
      particles = [];
      const total = targets.length + extra;
      for (let i = 0; i < total; i++) {
        const t = targets[i];
        const edge = Math.random() * 4;
        const sx = edge < 1 ? -40 : edge < 2 ? W + 40 : Math.random() * W;
        const sy = edge < 1 || edge < 2 ? Math.random() * H : edge < 3 ? -40 : H + 40;
        const tx = t ? t[0] : Math.random() * W;
        const ty = t ? t[1] : Math.random() * H;
        particles.push({
          sx, sy, tx, ty,
          a: Math.random() * Math.PI * 2,
          r: 60 + Math.random() * Math.min(W, H) * 0.42,
          spd: (0.4 + Math.random() * 0.9) * (Math.random() < 0.5 ? 1 : -1),
          delay: t ? (tx / W) * 500 + Math.random() * 350 : -1,
          size: t ? gap * (0.32 + Math.random() * 0.3) : 0.6 + Math.random() * 1.4,
          hue: tx / W,
          vx: 0, vy: 0,
        });
      }
    };

    const colorFor = (h: number, alpha: number) => {
      // red → orange → cyan sweep across the word
      const r = Math.round(255 - h * 200);
      const g = Math.round(59 + h * 170);
      const b = Math.round(59 + h * 196);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    const makeBolt = (now: number) => {
      const fromLeft = Math.random() < 0.5;
      let x = fromLeft ? 0 : W;
      let y = Math.random() * H;
      const tx = W / 2 + (Math.random() - 0.5) * W * 0.4;
      const ty = H / 2 + (Math.random() - 0.5) * 40;
      const pts: [number, number][] = [[x, y]];
      const steps = 14;
      for (let i = 1; i <= steps; i++) {
        const k = i / steps;
        x = x + (tx - x) / (steps - i + 1) + (Math.random() - 0.5) * 30;
        y = y + (ty - y) / (steps - i + 1) + (Math.random() - 0.5) * 40 * (1 - k);
        pts.push([x, y]);
      }
      bolts.push({ pts, born: now, hue: Math.random() });
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now() - start + offset;
      const cx = W / 2;
      const cy = H / 2;

      // phase bookkeeping for DOM layers
      const ph =
        now < T_CONVERGE ? "boot" : now < T_FORMED ? "converge" : now < T_YEAR ? "formed" : now < T_EXIT ? "year" : "exit";
      if (ph !== lastPhase) {
        lastPhase = ph;
        setPhase(ph as typeof phase);
      }
      const p = Math.round(clamp01(now / T_FORMED) ** 0.8 * 100);
      if (p !== lastPct) {
        lastPct = p;
        setPct(p);
      }
      const l = Math.min(BOOT_LINES.length, Math.floor(now / 420) + 1);
      if (l !== lastLines) {
        lastLines = l;
        setLines(l);
      }
      if (now >= T_EXIT && !revealed) {
        revealed = true;
        onReveal();
      }
      if (now >= T_END && !finished) {
        finished = true;
        cancelAnimationFrame(raf);
        onDone();
        return;
      }

      // motion trails
      ctx.globalCompositeOperation = "source-over";
      const exitK = clamp01((now - T_EXIT) / 900);
      ctx.fillStyle = `rgba(3,3,8,${0.28 + exitK * 0.5})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      const glitching =
        (now > T_FORMED && now < T_FORMED + 140) ||
        (now > T_FORMED + 520 && now < T_FORMED + 600) ||
        (now > T_YEAR + 700 && now < T_YEAR + 800) ||
        (now > T_EXIT - 160 && now < T_EXIT);
      const rgbShift = glitching ? 6 + Math.random() * 10 : 0;

      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        const orbitA = pt.a + (now / 1000) * pt.spd;
        const shrink = 1 - clamp01(now / T_FORMED) * 0.5;
        const ox = cx + Math.cos(orbitA) * pt.r * shrink;
        const oy = cy + Math.sin(orbitA) * pt.r * 0.45 * shrink;
        const spawnK = easeOutCubic(clamp01((now - i * 0.15) / 1300));
        let x = pt.sx + (ox - pt.sx) * spawnK;
        let y = pt.sy + (oy - pt.sy) * spawnK;
        let alpha = 0.25 + spawnK * 0.6;

        if (pt.delay >= 0) {
          const k = easeInOutCubic(clamp01((now - T_CONVERGE - pt.delay) / 1200));
          x = x + (pt.tx - x) * k;
          y = y + (pt.ty - y) * k;
          if (k >= 1) {
            x += Math.sin(now * 0.004 + i) * 0.6;
            y += Math.cos(now * 0.005 + i * 1.3) * 0.6;
          }
          alpha = 0.4 + k * 0.6;
        } else {
          alpha *= 0.45;
        }

        // exit: burst outwards
        if (exitK > 0) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.hypot(dx, dy) + 1;
          const burst = easeOutCubic(exitK) * (300 + (i % 7) * 60);
          x += (dx / dist) * burst;
          y += (dy / dist) * burst;
          alpha *= 1 - exitK;
        }

        const s = pt.size * (1 + exitK * 0.6);
        if (rgbShift && pt.delay >= 0) {
          const band = Math.floor(y / 18) % 3 === 0 ? (Math.random() - 0.5) * 40 : 0;
          ctx.fillStyle = `rgba(255,40,60,${alpha * 0.8})`;
          ctx.fillRect(x - rgbShift + band, y, s, s);
          ctx.fillStyle = `rgba(40,230,255,${alpha * 0.8})`;
          ctx.fillRect(x + rgbShift + band, y, s, s);
        } else {
          ctx.fillStyle = colorFor(pt.hue, alpha);
          ctx.fillRect(x, y, s, s);
        }
      }

      // lightning / energy bolts
      if (now > T_CONVERGE && now < T_YEAR + 400 && now > nextBolt) {
        makeBolt(now);
        nextBolt = now + 90 + Math.random() * 260;
      }
      for (let b = bolts.length - 1; b >= 0; b--) {
        const bolt = bolts[b];
        const age = (now - bolt.born) / 260;
        if (age > 1) {
          bolts.splice(b, 1);
          continue;
        }
        ctx.strokeStyle = colorFor(bolt.hue, (1 - age) * 0.8);
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 12;
        ctx.shadowColor = colorFor(bolt.hue, 1);
        ctx.beginPath();
        const upto = Math.ceil(bolt.pts.length * Math.min(1, age * 3));
        bolt.pts.slice(0, upto).forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // horizontal scanline sweep during boot
      if (now < T_CONVERGE + 300) {
        const k = clamp01(now / 900);
        const w = W * easeOutCubic(k);
        const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
        g.addColorStop(0, "rgba(255,59,59,0)");
        g.addColorStop(0.5, `rgba(255,255,255,${0.9 * (1 - clamp01((now - T_CONVERGE) / 300))})`);
        g.addColorStop(1, "rgba(61,232,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - w / 2, cy - 1, w, 2);
      }

      // glitch slice displacement
      if (glitching) {
        ctx.globalCompositeOperation = "source-over";
        for (let k = 0; k < 5; k++) {
          const sy = Math.random() * H;
          const sh = 4 + Math.random() * 30;
          const dx = (Math.random() - 0.5) * 80;
          ctx.drawImage(canvas, 0, sy * dpr, W * dpr, sh * dpr, dx, sy, W, sh);
        }
      }
    };

    const boot = async () => {
      try {
        await Promise.race([
          document.fonts.load('900 100px "Unbounded"'),
          new Promise((r) => setTimeout(r, 900)),
        ]);
      } catch {
        /* fall back to system font */
      }
      buildTargets();
      start = performance.now();
      frame();
    };
    boot();

    const onResize = () => buildTargets();
    window.addEventListener("resize", onResize);
    skipRef.current = () => {
      const now = performance.now() - start + offset;
      if (now < T_EXIT) offset += T_EXIT - now;
    };
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className={`intro intro--${phase}`} role="status" aria-label="Loading CARBONX 2027">
      <canvas ref={canvasRef} className="intro__canvas" />
      <div className="intro__grid" aria-hidden="true" />
      <div className="intro__logo" aria-hidden="true">
        <LogoMark animate />
      </div>
      <div className="intro__below" aria-hidden="true">
        <div className="intro__year">
          <span className="glitch" data-text="2027">2027</span>
        </div>
        <div className="intro__tag">
          <span>BUILD</span>
          <i />
          <span>INNOVATE</span>
          <i />
          <span>ELECTRIFY</span>
        </div>
      </div>
      <pre className="intro__boot" aria-hidden="true">
        {BOOT_LINES.slice(0, lines).map((l, i) => (
          <div key={i} className={i === BOOT_LINES.length - 1 ? "ok" : ""}>
            <span>&gt;</span> {l}
          </div>
        ))}
        <b className="caret" />
      </pre>
      <div className="intro__pct" aria-hidden="true">
        <small>SYSTEM CHARGE</small>
        <span>{String(pct).padStart(3, "0")}</span>
        <div className="intro__bar">
          <i style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
      </div>
      <div className="intro__shock" aria-hidden="true" />
      <button className="intro__skip" onClick={() => skipRef.current()} type="button">
        Skip intro <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

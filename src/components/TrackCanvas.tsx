import { useEffect, useRef } from "react";
import type { TrackId } from "../data/content";
import { isLowPower, prefersReducedMotion } from "../lib/device";

type Ctx = CanvasRenderingContext2D;
interface Painter {
  resize(w: number, h: number): void;
  draw(ctx: Ctx, t: number, dt: number, hot: number, px: number, py: number): void;
}

/* ------------------------------------------------------------------ */
/* VEGATHON — organic growth: branching vines, leaves, rising spores   */
/* ------------------------------------------------------------------ */
function vegathon(c1: string, c2: string): Painter {
  type Seg = { x1: number; y1: number; x2: number; y2: number; t0: number; w: number; leaf: boolean; side: number };
  let segs: Seg[] = [];
  let spores: { x: number; y: number; r: number; s: number; ph: number }[] = [];
  let W = 0;
  let H = 0;
  const CYCLE = 9;
  const grow = (x: number, y: number, ang: number, len: number, depth: number, t0: number, w: number) => {
    if (depth <= 0 || len < 6) return;
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    segs.push({ x1: x, y1: y, x2, y2, t0, w, leaf: depth <= 2, side: Math.random() < 0.5 ? -1 : 1 });
    const dur = 0.35;
    const n = depth > 5 ? 2 : Math.random() < 0.7 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const spread = 0.35 + Math.random() * 0.35;
      grow(x2, y2, ang + (i === 0 ? -spread : spread) + (Math.random() - 0.5) * 0.3, len * (0.72 + Math.random() * 0.12), depth - 1, t0 + dur, w * 0.7);
    }
  };
  return {
    resize(w, h) {
      W = w;
      H = h;
      segs = [];
      const roots = Math.max(3, Math.round(w / 140));
      for (let i = 0; i < roots; i++) {
        const x = (w / roots) * (i + 0.5) + (Math.random() - 0.5) * 40;
        grow(x, h + 4, -Math.PI / 2 + (Math.random() - 0.5) * 0.4, h * (0.14 + Math.random() * 0.06), 8, i * 0.25, 3.2);
      }
      spores = Array.from({ length: Math.round((w * h) / 9000) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 2.2,
        s: 8 + Math.random() * 26,
        ph: Math.random() * 10,
      }));
    },
    draw(ctx, t, dt, hot, px, py) {
      ctx.clearRect(0, 0, W, H);
      const local = (t * (1 + hot * 0.8)) % CYCLE;
      const fade = local > CYCLE - 1.2 ? (CYCLE - local) / 1.2 : 1;
      ctx.lineCap = "round";
      for (const s of segs) {
        const k = Math.max(0, Math.min(1, (local - s.t0) / 0.35));
        if (k <= 0) continue;
        const sway = Math.sin(t * 1.3 + s.y1 * 0.02) * 2 * (1 - s.w / 3.2);
        const x2 = s.x1 + (s.x2 - s.x1) * k + sway;
        const y2 = s.y1 + (s.y2 - s.y1) * k;
        ctx.strokeStyle = s.leaf ? c2 : c1;
        ctx.globalAlpha = (0.35 + hot * 0.4) * fade;
        ctx.lineWidth = s.w;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (s.leaf && k >= 1) {
          const ang = Math.atan2(s.y2 - s.y1, s.x2 - s.x1) + s.side * 0.9;
          ctx.save();
          ctx.translate(x2, y2);
          ctx.rotate(ang);
          ctx.fillStyle = c2;
          ctx.globalAlpha = (0.25 + hot * 0.45) * fade;
          ctx.beginPath();
          ctx.ellipse(6, 0, 7 + hot * 3, 2.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      // spores drift up, attracted to the pointer on hover
      for (const p of spores) {
        p.y -= p.s * dt * (0.6 + hot);
        p.x += Math.sin(t + p.ph) * 0.3;
        if (hot > 0.05 && px >= 0) {
          p.x += (px - p.x) * 0.012 * hot;
          p.y += (py - p.y) * 0.012 * hot;
        }
        if (p.y < -5) {
          p.y = H + 5;
          p.x = Math.random() * W;
        }
        ctx.globalAlpha = 0.5 + Math.sin(t * 3 + p.ph) * 0.3;
        ctx.fillStyle = c2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  };
}

/* ------------------------------------------------------------------ */
/* SIGNALTHON — radar pings, modulated carrier waves, spectrum bars    */
/* ------------------------------------------------------------------ */
function signalthon(c1: string, c2: string): Painter {
  let W = 0;
  let H = 0;
  let bars: number[] = [];
  return {
    resize(w, h) {
      W = w;
      H = h;
      bars = Array.from({ length: Math.max(16, Math.round(w / 14)) }, () => Math.random());
    },
    draw(ctx, t, _dt, hot, px, py) {
      ctx.clearRect(0, 0, W, H);
      // radar rings from the antenna (or the pointer on hover)
      const ox = hot > 0.05 && px >= 0 ? px : W * 0.78;
      const oy = hot > 0.05 && py >= 0 ? py : H * 0.3;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) {
        const k = ((t * (0.35 + hot * 0.4) + i / 5) % 1);
        ctx.strokeStyle = c1;
        ctx.globalAlpha = (1 - k) * (0.35 + hot * 0.4);
        ctx.beginPath();
        ctx.arc(ox, oy, k * Math.max(W, H) * 0.9, 0, Math.PI * 2);
        ctx.stroke();
      }
      // sweep
      const a = t * 1.4;
      const g = ctx.createConicGradient ? ctx.createConicGradient(a, ox, oy) : null;
      if (g) {
        g.addColorStop(0, "rgba(61,232,255,0.22)");
        g.addColorStop(0.08, "rgba(61,232,255,0)");
        g.addColorStop(1, "rgba(61,232,255,0)");
        ctx.globalAlpha = 0.6 + hot * 0.4;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      // carrier waves
      const waves = 3;
      for (let w = 0; w < waves; w++) {
        ctx.beginPath();
        ctx.strokeStyle = w % 2 ? c2 : c1;
        ctx.globalAlpha = 0.45 + hot * 0.4 - w * 0.1;
        ctx.lineWidth = w === 0 ? 2 : 1;
        const base = H * (0.5 + w * 0.08);
        const freq = (0.018 + w * 0.006) * (1 + hot * 0.8);
        for (let x = 0; x <= W; x += 3) {
          const env = Math.sin((x / W) * Math.PI);
          const am = 1 + 0.5 * Math.sin(x * 0.004 + t * 0.9);
          const y = base + Math.sin(x * freq + t * (2 + w)) * (18 + hot * 16) * env * am;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      // spectrum analyser
      const bw = W / bars.length;
      for (let i = 0; i < bars.length; i++) {
        const target = 0.2 + 0.8 * Math.abs(Math.sin(t * (1.5 + (i % 5) * 0.4) + i * 0.6)) * (0.6 + hot * 0.5);
        bars[i] += (target - bars[i]) * 0.15;
        const h = bars[i] * H * 0.16;
        ctx.globalAlpha = 0.25 + hot * 0.35;
        ctx.fillStyle = i % 3 ? c1 : c2;
        ctx.fillRect(i * bw + 2, H - h, bw - 4, h);
      }
      ctx.globalAlpha = 1;
    },
  };
}

/* ------------------------------------------------------------------ */
/* ELECTROTHON — PCB traces, travelling current, a chip and sparks     */
/* ------------------------------------------------------------------ */
function electrothon(c1: string, c2: string): Painter {
  let W = 0;
  let H = 0;
  let traces: { pts: [number, number][]; len: number }[] = [];
  let pulses: { tr: number; p: number; v: number }[] = [];
  let chip = { x: 0, y: 0, w: 0, h: 0 };
  const G = 22;
  const buildTrace = (sx: number, sy: number) => {
    const pts: [number, number][] = [[sx, sy]];
    let x = sx;
    let y = sy;
    let dir = Math.floor(Math.random() * 4);
    const steps = 4 + Math.floor(Math.random() * 6);
    for (let i = 0; i < steps; i++) {
      const L = G * (1 + Math.floor(Math.random() * 4));
      if (Math.random() < 0.5) dir = (dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
      // allow 45° jogs like real routing
      const diag = Math.random() < 0.25;
      const dx = [1, 0, -1, 0][dir];
      const dy = [0, 1, 0, -1][dir];
      x += dx * L + (diag ? dy * G : 0);
      y += dy * L + (diag ? dx * G : 0);
      pts.push([x, y]);
    }
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return { pts, len };
  };
  const at = (tr: { pts: [number, number][]; len: number }, p: number): [number, number] => {
    let d = p * tr.len;
    for (let i = 1; i < tr.pts.length; i++) {
      const [ax, ay] = tr.pts[i - 1];
      const [bx, by] = tr.pts[i];
      const s = Math.hypot(bx - ax, by - ay);
      if (d <= s) return [ax + ((bx - ax) * d) / s, ay + ((by - ay) * d) / s];
      d -= s;
    }
    return tr.pts[tr.pts.length - 1];
  };
  return {
    resize(w, h) {
      W = w;
      H = h;
      chip = { w: Math.min(120, w * 0.3), h: Math.min(120, w * 0.3), x: w * 0.62, y: h * 0.28 };
      traces = [];
      const n = Math.round((w * h) / 7000);
      for (let i = 0; i < n; i++) {
        // half the traces start at chip pins
        if (i % 2 === 0) {
          const side = i % 8;
          const k = Math.random();
          const sx = side < 2 ? chip.x - chip.w / 2 : side < 4 ? chip.x + chip.w / 2 : chip.x - chip.w / 2 + k * chip.w;
          const sy = side < 4 ? chip.y - chip.h / 2 + k * chip.h : side < 6 ? chip.y - chip.h / 2 : chip.y + chip.h / 2;
          traces.push(buildTrace(Math.round(sx / G) * G, Math.round(sy / G) * G));
        } else traces.push(buildTrace(Math.round((Math.random() * w) / G) * G, Math.round((Math.random() * h) / G) * G));
      }
      pulses = traces.map((_, i) => ({ tr: i, p: Math.random(), v: 0.25 + Math.random() * 0.5 }));
    },
    draw(ctx, t, dt, hot, px, py) {
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = "round";
      // traces
      ctx.strokeStyle = c1;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.18 + hot * 0.2;
      for (const tr of traces) {
        ctx.beginPath();
        tr.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        const [ex, ey] = tr.pts[tr.pts.length - 1];
        ctx.beginPath();
        ctx.arc(ex, ey, 2.6, 0, Math.PI * 2);
        ctx.stroke();
      }
      // chip
      ctx.globalAlpha = 0.5 + hot * 0.4;
      ctx.strokeStyle = c1;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(chip.x - chip.w / 2, chip.y - chip.h / 2, chip.w, chip.h);
      ctx.globalAlpha = 0.12 + hot * 0.15 + Math.sin(t * 4) * 0.04;
      ctx.fillStyle = c1;
      ctx.fillRect(chip.x - chip.w / 2 + 8, chip.y - chip.h / 2 + 8, chip.w - 16, chip.h - 16);
      for (let i = 0; i < 6; i++) {
        const o = -chip.w / 2 + (chip.w / 7) * (i + 1);
        ctx.globalAlpha = 0.5;
        ctx.fillRect(chip.x + o - 2, chip.y - chip.h / 2 - 8, 4, 8);
        ctx.fillRect(chip.x + o - 2, chip.y + chip.h / 2, 4, 8);
      }
      // current pulses
      for (const pu of pulses) {
        pu.p += pu.v * dt * (1 + hot * 2);
        if (pu.p > 1) {
          pu.p = 0;
          pu.tr = Math.floor(Math.random() * traces.length);
        }
        const tr = traces[pu.tr];
        const [x, y] = at(tr, pu.p);
        const [bx, by] = at(tr, Math.max(0, pu.p - 0.08));
        const g = ctx.createLinearGradient(bx, by, x, y);
        g.addColorStop(0, "rgba(255,177,61,0)");
        g.addColorStop(1, c2);
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // arc to pointer on hover
      if (hot > 0.2 && px >= 0) {
        ctx.strokeStyle = "#fff";
        ctx.globalAlpha = hot * (0.5 + Math.random() * 0.5);
        ctx.lineWidth = 1.2;
        ctx.shadowColor = c2;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        let x = chip.x;
        let y = chip.y;
        ctx.moveTo(x, y);
        for (let i = 1; i <= 8; i++) {
          x = chip.x + ((px - chip.x) * i) / 8 + (i < 8 ? (Math.random() - 0.5) * 22 : 0);
          y = chip.y + ((py - chip.y) * i) / 8 + (i < 8 ? (Math.random() - 0.5) * 22 : 0);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    },
  };
}

const FACTORY: Record<TrackId, (a: string, b: string) => Painter> = { vegathon, signalthon, electrothon };

/** Runs a track's generative animation only while visible. `hotRef` (0..1) intensifies it. */
export default function TrackCanvas({
  kind,
  c1,
  c2,
  hotRef,
}: {
  kind: TrackId;
  c1: string;
  c2: string;
  hotRef: React.MutableRefObject<{ hot: number; x: number; y: number }>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const painter = FACTORY[kind](c1, c2);
    const dpr = Math.min(window.devicePixelRatio, isLowPower() ? 1.25 : 2);
    const reduced = prefersReducedMotion();
    let raf = 0;
    let visible = false;
    let last = performance.now();
    let t = Math.random() * 10;
    let hot = 0;
    const size = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      painter.resize(r.width, r.height);
    };
    const frame = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += reduced ? 0 : dt;
      hot += (hotRef.current.hot - hot) * 0.08;
      painter.draw(ctx, t, reduced ? 0 : dt, hot, hotRef.current.x, hotRef.current.y);
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    };
    const ro = new ResizeObserver(() => {
      size();
      if (!visible || reduced) frame();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        last = performance.now();
        frame();
      }
    });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [kind, c1, c2, hotRef]);
  return <canvas ref={ref} className="tcanvas" aria-hidden="true" />;
}

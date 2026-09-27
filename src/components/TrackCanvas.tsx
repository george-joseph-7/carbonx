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
  type Seg = { x1: number; y1: number; x2: number; y2: number; t0: number; w: number; leaf: boolean; side: number; ang: number };
  let segs: Seg[] = [];
  let groups: { w: number; leaf: boolean; segs: Seg[] }[] = [];
  // One pre-rendered leaf, stamped with drawImage: far cheaper than hundreds of AA ellipse fills
  const leaf = document.createElement("canvas");
  leaf.width = 40;
  leaf.height = 12;
  {
    const lc = leaf.getContext("2d")!;
    lc.fillStyle = c2;
    lc.beginPath();
    lc.ellipse(20, 6, 18, 5, 0, 0, Math.PI * 2);
    lc.fill();
  }
  let spores: { x: number; y: number; r: number; s: number; ph: number }[] = [];
  let W = 0;
  let H = 0;
  const CYCLE = 9;
  const grow = (x: number, y: number, ang: number, len: number, depth: number, t0: number, w: number) => {
    if (depth <= 0 || len < 6) return;
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    segs.push({ x1: x, y1: y, x2, y2, t0, w, leaf: depth <= 2, side: Math.random() < 0.5 ? -1 : 1, ang });
    const dur = 0.35;
    const n = depth > 4 ? 2 : Math.random() < 0.55 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const spread = 0.35 + Math.random() * 0.35;
      grow(x2, y2, ang + (i === 0 ? -spread : spread) + (Math.random() - 0.5) * 0.3, len * (0.72 + Math.random() * 0.12), depth - 1, t0 + dur, w * 0.7);
    }
  };
  let treeCache: HTMLCanvasElement | null = null;
  let grownAt = 0;
  /** Draws the branches + leaves into `ctx` at cycle time `local`. */
  const drawTree = (ctx: Ctx, local: number, t: number, hot: number, fade: number) => {
    ctx.lineCap = "round";
    // Batched: one path per branch thickness and one for every leaf, instead of a
    // separate stroke/fill (plus save/restore) for each of the hundreds of segments.
    ctx.globalAlpha = (0.35 + hot * 0.4) * fade;
    const leaves: number[] = [];
    for (const group of groups) {
      const path = new Path2D();
      for (const s of group.segs) {
        const k = Math.max(0, Math.min(1, (local - s.t0) / 0.35));
        if (k <= 0) continue;
        const sway = Math.sin(t * 1.3 + s.y1 * 0.02) * 2 * (1 - s.w / 3.2);
        const x2 = s.x1 + (s.x2 - s.x1) * k + sway;
        const y2 = s.y1 + (s.y2 - s.y1) * k;
        path.moveTo(s.x1, s.y1);
        path.lineTo(x2, y2);
        if (s.leaf && k >= 1) {
          const ang = s.ang + s.side * 0.9;
          leaves.push(x2 + Math.cos(ang) * 6, y2 + Math.sin(ang) * 6, ang);
        }
      }
      ctx.strokeStyle = group.leaf ? c2 : c1;
      ctx.lineWidth = group.w;
      ctx.stroke(path);
    }
    ctx.globalAlpha = (0.25 + hot * 0.45) * fade;
    const base = ctx.getTransform();
    const lw = 14 + hot * 6;
    for (let i = 0; i < leaves.length; i += 3) {
      const c = Math.cos(leaves[i + 2]);
      const sn = Math.sin(leaves[i + 2]);
      ctx.setTransform(base.a * c, base.a * sn, -base.a * sn, base.a * c, base.e + base.a * leaves[i], base.f + base.a * leaves[i + 1]);
      ctx.drawImage(leaf, -lw / 2, -2.6, lw, 5.2);
    }
    ctx.setTransform(base);
  };
  return {
    resize(w, h) {
      W = w;
      H = h;
      segs = [];
      const roots = Math.max(3, Math.round(w / 140));
      for (let i = 0; i < roots; i++) {
        const x = (w / roots) * (i + 0.5) + (Math.random() - 0.5) * 40;
        grow(x, h + 4, -Math.PI / 2 + (Math.random() - 0.5) * 0.4, h * (0.15 + Math.random() * 0.06), 7, i * 0.25, 3.2);
      }
      const byKey = new Map<string, { w: number; leaf: boolean; segs: Seg[] }>();
      for (const sg of segs) {
        const key = `${sg.w.toFixed(2)}|${sg.leaf}`;
        if (!byKey.has(key)) byKey.set(key, { w: sg.w, leaf: sg.leaf, segs: [] });
        byKey.get(key)!.segs.push(sg);
      }
      groups = [...byKey.values()];
      grownAt = Math.max(...segs.map((sg) => sg.t0)) + 0.35;
      treeCache = null;
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
      if (local < grownAt) {
        drawTree(ctx, local, t, hot, fade);
      } else {
        // Fully grown: blit the cached tree instead of re-stroking hundreds of segments
        if (!treeCache) {
          const base = ctx.getTransform();
          treeCache = document.createElement("canvas");
          treeCache.width = Math.max(1, Math.round(W * base.a));
          treeCache.height = Math.max(1, Math.round(H * base.a));
          const tc = treeCache.getContext("2d")!;
          tc.setTransform(base.a, 0, 0, base.a, 0, 0);
          drawTree(tc, grownAt, 0, 0, 1);
        }
        ctx.globalAlpha = fade;
        ctx.drawImage(treeCache, 0, 0, W, H);
        if (hot > 0.05) {
          ctx.globalAlpha = fade * hot;
          ctx.drawImage(treeCache, 0, 0, W, H);
        }
      }
      // spores drift up, attracted to the pointer on hover (3 twinkle groups, 3 fills)
      const sporePaths = [new Path2D(), new Path2D(), new Path2D()];
      spores.forEach((p, i) => {
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
        const sp = sporePaths[i % 3];
        sp.rect(p.x - p.r * 0.8, p.y - p.r * 0.8, p.r * 1.6, p.r * 1.6);
      });
      ctx.fillStyle = c2;
      sporePaths.forEach((sp, g) => {
        ctx.globalAlpha = 0.5 + Math.sin(t * 3 + g * 2.1) * 0.3;
        ctx.fill(sp);
      });
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
      for (let i = 0; i < 4; i++) {
        const k = ((t * (0.35 + hot * 0.4) + i / 4) % 1);
        ctx.strokeStyle = c1;
        ctx.globalAlpha = (1 - k) * (0.35 + hot * 0.4);
        ctx.beginPath();
        ctx.arc(ox, oy, k * Math.max(W, H) * 0.9, 0, Math.PI * 2);
        ctx.stroke();
      }
      // sweep
      const a = t * 1.4;
      const R = Math.max(W, H) * 0.75;
      ctx.fillStyle = c1;
      for (let k = 0; k < 2; k++) {
        // a trailing pair of thin wedges fakes the radar gradient for a fraction of the fill cost
        ctx.globalAlpha = (0.08 - k * 0.035) * (0.6 + hot * 0.4);
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.arc(ox, oy, R, a - 0.12 * (k + 1), a - 0.12 * k);
        ctx.closePath();
        ctx.fill();
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
        for (let x = 0; x <= W; x += 6) {
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
  let traceLayer: HTMLCanvasElement | null = null;
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
      // the routing never changes, so draw it once and blit it every frame
      const dpr = Math.min(window.devicePixelRatio, 1.25);
      traceLayer = document.createElement("canvas");
      traceLayer.width = Math.max(1, w * dpr);
      traceLayer.height = Math.max(1, h * dpr);
      const tc = traceLayer.getContext("2d")!;
      tc.scale(dpr, dpr);
      tc.strokeStyle = c1;
      tc.lineWidth = 1.4;
      tc.lineJoin = "round";
      tc.beginPath();
      for (const tr of traces) {
        tr.pts.forEach(([x, y], i) => (i ? tc.lineTo(x, y) : tc.moveTo(x, y)));
        const [ex, ey] = tr.pts[tr.pts.length - 1];
        tc.moveTo(ex + 2.6, ey);
        tc.arc(ex, ey, 2.6, 0, Math.PI * 2);
      }
      tc.stroke();
    },
    draw(ctx, t, dt, hot, px, py) {
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = "round";
      // traces
      if (traceLayer) {
        ctx.globalAlpha = 0.18 + hot * 0.2;
        ctx.drawImage(traceLayer, 0, 0, W, H);
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
      // current pulses — all tails in one stroke, all heads in one fill
      const tails = new Path2D();
      const heads = new Path2D();
      for (const pu of pulses) {
        pu.p += pu.v * dt * (1 + hot * 2);
        if (pu.p > 1) {
          pu.p = 0;
          pu.tr = Math.floor(Math.random() * traces.length);
        }
        const tr = traces[pu.tr];
        const [x, y] = at(tr, pu.p);
        const [bx, by] = at(tr, Math.max(0, pu.p - 0.08));
        tails.moveTo(bx, by);
        tails.lineTo(x, y);
        heads.moveTo(x + 1.8, y);
        heads.arc(x, y, 1.8, 0, Math.PI * 2);
      }
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = c2;
      ctx.lineWidth = 2.2;
      ctx.stroke(tails);
      ctx.fillStyle = "#fff";
      ctx.fill(heads);
      // arc to pointer on hover
      if (hot > 0.2 && px >= 0) {
        // glow = a wide faint stroke under a thin bright one (shadowBlur is very slow)
        ctx.globalAlpha = hot * (0.5 + Math.random() * 0.5);
        ctx.beginPath();
        let x = chip.x;
        let y = chip.y;
        ctx.moveTo(x, y);
        for (let i = 1; i <= 8; i++) {
          x = chip.x + ((px - chip.x) * i) / 8 + (i < 8 ? (Math.random() - 0.5) * 22 : 0);
          y = chip.y + ((py - chip.y) * i) / 8 + (i < 8 ? (Math.random() - 0.5) * 22 : 0);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = c2;
        ctx.lineWidth = 6;
        const a = ctx.globalAlpha;
        ctx.globalAlpha = a * 0.25;
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = a;
        ctx.stroke();
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
    const dpr = Math.min(window.devicePixelRatio, isLowPower() ? 1 : 1.25);
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
      if (visible && !reduced) raf = requestAnimationFrame(frame);
      const now = performance.now();
      // ~20fps while idle (slow ambient motion hides it), 60fps on the hovered card
      const minGap = hotRef.current.hot > 0 || hot > 0.05 ? 15.5 : 48;
      if (visible && !reduced && now - last < minGap) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += reduced ? 0 : dt;
      hot += (hotRef.current.hot - hot) * 0.08;
      painter.draw(ctx, t, reduced ? 0 : dt, hot, hotRef.current.x, hotRef.current.y);
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

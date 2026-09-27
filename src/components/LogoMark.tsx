import { useMemo } from "react";

/** Projected C60 cage — front-facing edges only — echoing the CarbonX mark. */
function cage(cx: number, cy: number, r: number) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const base = [
    [0, 1, 3 * phi],
    [1, 2 + phi, 2 * phi],
    [phi, 2, 2 * phi + 1],
  ];
  const verts: number[][] = [];
  const seen = new Set<string>();
  for (const [a, b, c] of base)
    for (const [x, y, z] of [
      [a, b, c],
      [b, c, a],
      [c, a, b],
    ])
      for (const sx of [1, -1])
        for (const sy of [1, -1])
          for (const sz of [1, -1]) {
            const v = [x * sx, y * sy, z * sz];
            const k = v.map((n) => n.toFixed(3)).join();
            if (!seen.has(k)) {
              seen.add(k);
              verts.push(v);
            }
          }
  const len = Math.hypot(...verts[0]);
  // tilt the cage a little so it reads as a sphere
  const ax = 0.5;
  const ay = 0.35;
  const rot = verts.map(([x, y, z]) => {
    const y1 = y * Math.cos(ax) - z * Math.sin(ax);
    const z1 = y * Math.sin(ax) + z * Math.cos(ax);
    const x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
    const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
    return [x2 / len, y1 / len, z2 / len];
  });
  const edges: [number, number][] = [];
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++) {
      const d = Math.hypot(verts[i][0] - verts[j][0], verts[i][1] - verts[j][1], verts[i][2] - verts[j][2]);
      if (Math.abs(d - 2) < 0.01 && rot[i][2] + rot[j][2] > -0.15) edges.push([i, j]);
    }
  const pts = rot.map(([x, y, z]) => ({ x: cx + x * r, y: cy + y * r, front: z > 0.05 }));
  return { pts, edges };
}

export default function LogoMark({ animate = false, className = "" }: { animate?: boolean; className?: string }) {
  const { pts, edges } = useMemo(() => cage(150, 200, 108), []);
  return (
    <svg className={`logomark ${animate ? "logomark--draw" : ""} ${className}`} viewBox="0 0 380 380" aria-hidden="true">
      <defs>
        <linearGradient id="lm-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3b3b" />
          <stop offset="0.6" stopColor="#ff6b3b" />
          <stop offset="1" stopColor="#3de8ff" />
        </linearGradient>
        <filter id="lm-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#lm-glow)">
        <g className="logomark__cage">
          {edges.map(([a, b], i) => (
            <line
              key={i}
              x1={pts[a].x}
              y1={pts[a].y}
              x2={pts[b].x}
              y2={pts[b].y}
              pathLength={1}
              style={{ animationDelay: `${(i % 30) * 28}ms` }}
            />
          ))}
          {pts.map((p, i) =>
            p.front ? <circle key={i} cx={p.x} cy={p.y} r={5.5} style={{ animationDelay: `${600 + (i % 20) * 30}ms` }} /> : null,
          )}
        </g>
        <path className="logomark__x" d="M178 56 L230 56 L330 330 L278 330 Z" pathLength={1} />
        <ellipse
          className="logomark__ring"
          cx="190"
          cy="205"
          rx="182"
          ry="52"
          transform="rotate(-20 190 205)"
          pathLength={1}
        />
      </g>
    </svg>
  );
}

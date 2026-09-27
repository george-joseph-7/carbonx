import { useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import { motion, useInView } from "framer-motion";
import { gsap, ScrollTrigger } from "../lib/scroll";
import { prefersReducedMotion } from "../lib/device";

const GLYPHS = "!<>-_\\/[]{}—=+*^?#01ABCDEFXZ";

/** Scrambles from noise into `text` when it scrolls into view (or when `play` flips true). */
export function ScrambleText({
  text,
  className,
  play,
  duration = 900,
  hover = false,
}: {
  text: string;
  className?: string;
  play?: boolean;
  duration?: number;
  hover?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [out, setOut] = useState(text);
  const runRef = useRef<() => void>(() => {});

  runRef.current = () => {
    if (prefersReducedMotion()) {
      setOut(text);
      return;
    }
    const start = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - start) / duration);
      const reveal = Math.floor(k * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        if (i < reveal || text[i] === " ") s += text[i];
        else s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setOut(s);
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  };

  const shouldPlay = play ?? inView;
  useEffect(() => {
    if (shouldPlay) runRef.current();
  }, [shouldPlay, text]);

  return (
    <span
      ref={ref}
      className={className}
      aria-label={text}
      onPointerEnter={hover ? () => runRef.current() : undefined}
    >
      <span aria-hidden="true">{out}</span>
    </span>
  );
}

/** A link/button that is pulled toward the cursor, with an animated energy border. */
export function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  external,
  cursor,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  external?: boolean;
  cursor?: string;
}) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const onMove = (e: RPointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.setProperty("--mx", `${x * 0.28}px`);
    el.style.setProperty("--my", `${y * 0.35}px`);
    el.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--mx", "0px");
    ref.current?.style.setProperty("--my", "0px");
  };
  const cls = `mbtn mbtn--${variant} ${className}`;
  const inner = (
    <>
      <span className="mbtn__border" aria-hidden="true" />
      <span className="mbtn__fill" aria-hidden="true" />
      <span className="mbtn__label">{children}</span>
    </>
  );
  if (href)
    return (
      <a
        ref={ref}
        href={href}
        className={cls}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={onClick}
        data-cursor={cursor}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  return (
    <button ref={ref} type="button" className={cls} onPointerMove={onMove} onPointerLeave={onLeave} onClick={onClick} data-cursor={cursor}>
      {inner}
    </button>
  );
}

/** Section header: index + eyebrow, character-staggered title, optional description. */
export function SectionHeader({
  index,
  eyebrow,
  title,
  accent,
  description,
  align = "left",
}: {
  index: string;
  eyebrow: string;
  title: string;
  accent?: string;
  description?: ReactNode;
  align?: "left" | "center";
}) {
  const words = title.split(" ");
  return (
    <header className={`shead shead--${align}`}>
      <motion.div
        className="shead__eyebrow"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.6 }}
      >
        <span className="shead__index">{index}</span>
        <span className="shead__line" />
        <ScrambleText text={eyebrow} />
      </motion.div>
      {/* The observer lives on the heading: the chars start clipped by their word mask,
          and IntersectionObserver treats clipped elements as off-screen. */}
      <motion.h2
        className="shead__title"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: "-10% 0px" }}
      >
        {words.map((w, wi) => (
          <span className="shead__word" key={wi}>
            {w.split("").map((c, ci) => (
              <motion.span
                key={ci}
                className={accent && w.includes(accent) ? "shead__char accent" : "shead__char"}
                variants={{
                  hidden: { y: "110%", rotateX: -80, opacity: 0 },
                  shown: {
                    y: "0%",
                    rotateX: 0,
                    opacity: 1,
                    transition: { duration: 0.8, delay: wi * 0.08 + ci * 0.025, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
              >
                {c}
              </motion.span>
            ))}
            {wi < words.length - 1 ? "\u00a0" : null}
          </span>
        ))}
      </motion.h2>
      {description ? (
        <motion.p
          className="shead__desc"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.9, delay: 0.3 }}
        >
          {description}
        </motion.p>
      ) : null}
    </header>
  );
}

/**
 * The connective tissue between sections: a signal trace that draws itself as you
 * scroll past, with a travelling spark — so the page reads as one continuous circuit.
 */
export function Seam({ variant = "wave", label }: { variant?: "wave" | "circuit" | "pulse"; label?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const path = svg.querySelector<SVGPathElement>(".seam__path")!;
    const spark = svg.querySelector<SVGCircleElement>(".seam__spark")!;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    const st = ScrollTrigger.create({
      trigger: svg,
      start: "top 95%",
      end: "bottom 35%",
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        path.style.strokeDashoffset = `${len * (1 - p)}`;
        const pt = path.getPointAtLength(len * p);
        spark.setAttribute("cx", String(pt.x));
        spark.setAttribute("cy", String(pt.y));
        spark.style.opacity = p > 0.01 && p < 0.99 ? "1" : "0";
      },
    });
    return () => st.kill();
  }, []);

  const d =
    variant === "wave"
      ? "M0 60 C 120 60 140 10 240 10 S 360 110 480 110 S 600 10 720 10 S 840 110 960 110 S 1080 60 1200 60"
      : variant === "circuit"
        ? "M0 20 H 260 L 300 60 H 520 L 560 100 H 760 L 800 60 H 980 L 1020 20 H 1200"
        : "M0 60 H 420 L 450 60 L 470 10 L 500 110 L 530 20 L 555 80 L 575 60 H 1200";
  return (
    <div className="seam" aria-hidden="true">
      <svg ref={ref} viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path className="seam__ghost" d={d} />
        <path className="seam__path" d={d} />
        <circle className="seam__spark" r="5" cx="0" cy="60" />
      </svg>
      {label ? <span className="seam__label">{label}</span> : null}
    </div>
  );
}

/** Pointer-reactive 3D tilt + spotlight for cards. Writes CSS vars only. */
export function useTilt<T extends HTMLElement>(strength = 10) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--rx", `${(0.5 - py) * strength}deg`);
      el.style.setProperty("--ry", `${(px - 0.5) * strength}deg`);
      el.style.setProperty("--px", `${px * 100}%`);
      el.style.setProperty("--py", `${py * 100}%`);
    };
    const leave = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return ref;
}

/** Count up when visible. */
export function Counter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const obj = { v: 0 };
    const el = ref.current;
    const tw = gsap.to(obj, {
      v: value,
      duration: prefersReducedMotion() ? 0 : duration,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = Math.round(obj.v).toLocaleString("en-IN") + suffix;
      },
    });
    return () => {
      tw.kill();
    };
  }, [inView, value, suffix, duration]);
  return (
    <span ref={ref} className="counter">
      0{suffix}
    </span>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { event, tracks, type Track } from "../data/content";
import { lockScroll } from "../lib/scroll";
import { setPreset } from "../three/sceneState";
import TrackCanvas from "./TrackCanvas";
import { MagneticButton, SectionHeader } from "./ui";

/** Animates an SVG turbulence displacement — the "distort" on hover. */
function useDistort(id: string) {
  const raf = useRef(0);
  const kick = () => {
    const turb = document.getElementById(`${id}-turb`);
    const disp = document.getElementById(`${id}-disp`);
    if (!turb || !disp) return;
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - start) / 750);
      const s = Math.sin(k * Math.PI) * 38 * (1 - k * 0.4);
      disp.setAttribute("scale", String(s));
      turb.setAttribute("baseFrequency", `${0.012 + k * 0.02} ${0.06 - k * 0.03}`);
      if (k < 1) raf.current = requestAnimationFrame(step);
      else disp.setAttribute("scale", "0");
    };
    step();
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return kick;
}

function TrackPanel({
  t,
  active,
  anyActive,
  onHover,
  onOpen,
}: {
  t: Track;
  active: boolean;
  anyActive: boolean;
  onHover: (id: string | null) => void;
  onOpen: () => void;
}) {
  const hotRef = useRef({ hot: 0, x: -1, y: -1 });
  const ref = useRef<HTMLElement>(null);
  const distort = useDistort(`f-${t.id}`);

  const move = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    hotRef.current.x = x;
    hotRef.current.y = y;
    ref.current!.style.setProperty("--px", `${x}px`);
    ref.current!.style.setProperty("--py", `${y}px`);
    ref.current!.style.setProperty("--rx", `${((y / r.height) - 0.5) * -6}deg`);
    ref.current!.style.setProperty("--ry", `${((x / r.width) - 0.5) * 8}deg`);
  };

  return (
    <motion.article
      ref={ref}
      id={`track-${t.id}`}
      className={`track track--${t.id} ${active ? "is-active" : ""} ${anyActive && !active ? "is-dim" : ""}`}
      style={{ "--c1": t.color, "--c2": t.color2 } as React.CSSProperties}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        hotRef.current.hot = 1;
        onHover(t.id);
        distort();
      }}
      onPointerLeave={() => {
        hotRef.current.hot = 0;
        hotRef.current.x = -1;
        onHover(null);
        ref.current?.style.setProperty("--rx", "0deg");
        ref.current?.style.setProperty("--ry", "0deg");
      }}
      onPointerMove={move}
      onClick={onOpen}
      data-cursor="OPEN"
      initial={{ opacity: 0, y: 80, clipPath: "inset(30% 0% 0% 0% round 28px)" }}
      whileInView={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0% round 28px)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, delay: Number(t.index) * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div layoutId={`shell-${t.id}`} className="track__shell" />
      <TrackCanvas kind={t.id} c1={t.color} c2={t.color2} hotRef={hotRef} />
      <div className="track__spot" aria-hidden="true" />
      <div className="track__grid" aria-hidden="true" />

      <svg className="track__filters" aria-hidden="true">
        <filter id={`f-${t.id}`}>
          <feTurbulence id={`f-${t.id}-turb`} type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="2" seed={Number(t.index)} />
          <feDisplacementMap id={`f-${t.id}-disp`} in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="track__top">
        <span className="track__index">{t.index}</span>
        <span className="track__emoji" aria-hidden="true">
          {t.emoji}
        </span>
      </div>

      <div className="track__body">
        <span className="track__kicker">{t.kicker}</span>
        <h3 className="track__name" style={{ filter: `url(#f-${t.id})` }}>
          {t.name}
        </h3>
        <p className="track__short">{t.short}</p>
        <div className="track__reveal">
          <p>{t.description}</p>
          <ul>
            {t.themes.slice(0, 3).map((th) => (
              <li key={th}>{th}</li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          className="track__open"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <span>Enter track</span>
          <i aria-hidden="true">→</i>
        </button>
      </div>
      <span className="track__edge" aria-hidden="true" />
    </motion.article>
  );
}

function TrackModal({ t, onClose }: { t: Track; onClose: () => void }) {
  const hotRef = useRef({ hot: 0.6, x: -1, y: -1 });
  useEffect(() => {
    lockScroll(true);
    setPreset(t.id);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      lockScroll(false);
      setPreset("tracks");
      window.removeEventListener("keydown", esc);
    };
  }, [t.id, onClose]);

  return (
    <motion.div
      className="tmodal"
      style={{ "--c1": t.color, "--c2": t.color2 } as React.CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={`${t.name} track details`}
      initial={{ backgroundColor: "rgba(3,3,8,0)" }}
      animate={{ backgroundColor: "rgba(3,3,8,0.7)" }}
      exit={{ backgroundColor: "rgba(3,3,8,0)" }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`shell-${t.id}`}
        className="tmodal__panel"
        onClick={(e) => e.stopPropagation()}
        transition={{ type: "spring", stiffness: 180, damping: 26 }}
      >
        <TrackCanvas kind={t.id} c1={t.color} c2={t.color2} hotRef={hotRef} />
        <motion.div
          className="tmodal__content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.6 } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <button type="button" className="tmodal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <div className="tmodal__head">
            <span className="tmodal__index">
              TRACK {t.index} <span aria-hidden="true">{t.emoji}</span>
            </span>
            <h3>{t.name}</h3>
            <p className="tmodal__short">{t.short}</p>
          </div>
          <div className="tmodal__cols">
            <div>
              <p className="tmodal__desc">{t.description}</p>
              <div className="tmodal__stack">
                {t.stack.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <h4>Focus areas</h4>
              <ol>
                {t.themes.map((th, i) => (
                  <motion.li
                    key={th}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.07 }}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {th}
                  </motion.li>
                ))}
              </ol>
              <p className="tmodal__note">Detailed problem statements will be released closer to the event.</p>
            </div>
          </div>
          <div className="tmodal__ctas">
            <MagneticButton href={event.registerUrl} external>
              Register for {t.name} <span className="arrow">↗</span>
            </MagneticButton>
            <MagneticButton variant="ghost" onClick={onClose}>
              Back to tracks
            </MagneticButton>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Tracks() {
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState<Track | null>(null);
  const touched = useRef(false);
  const close = useCallback(() => setOpen(null), []);

  // Hovering a track re-tints the whole WebGL world to that track's palette
  useEffect(() => {
    if (open) return;
    if (hover) touched.current = true;
    if (touched.current) setPreset(hover ?? "tracks");
  }, [hover, open]);

  return (
    <section id="tracks" className="section tracks" data-preset="tracks">
      <div className="container container--wide">
        <SectionHeader
          index="03"
          eyebrow="CHOOSE YOUR ARENA"
          title="Three tracks. One circuit."
          accent="circuit."
          description="Charge a track to feel its energy, then step inside for the full brief. Each arena runs on its own physics."
        />
        <div className={`tracks__row ${hover ? "has-active" : ""}`}>
          {tracks.map((t) => (
            <TrackPanel
              key={t.id}
              t={t}
              active={hover === t.id}
              anyActive={!!hover}
              onHover={setHover}
              onOpen={() => setOpen(t)}
            />
          ))}
        </div>
      </div>
      <AnimatePresence>{open ? <TrackModal key={open.id} t={open} onClose={close} /> : null}</AnimatePresence>
    </section>
  );
}

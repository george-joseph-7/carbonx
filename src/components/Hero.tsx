import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { event, tracks } from "../data/content";
import { gsap, ScrollTrigger, scrollToTarget } from "../lib/scroll";
import { prefersReducedMotion } from "../lib/device";
import { MagneticButton, ScrambleText } from "./ui";

const WORD = "CARBONX".split("");

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{now.toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Kolkata" })} IST</>;
}

export default function Hero({ play }: { play: boolean }) {
  const root = useRef<HTMLElement>(null);

  // Scroll-out: letters drift apart, content lifts and dissolves into the next section.
  useEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 },
      });
      tl.to(".hero__char-wrap", { yPercent: (i) => (i % 2 ? -40 : 30) * (1 + i * 0.12), opacity: 0.1, ease: "none", stagger: 0.01 }, 0)
        .to(".hero__title", { scale: 0.92, opacity: 0.35, ease: "none" }, 0)
        .to(".hero__below", { y: -80, opacity: 0, ease: "none" }, 0)
        .to(".hero__hud", { opacity: 0, ease: "none" }, 0);
    }, root);
    return () => ctx.revert();
  }, []);

  // Once the letters have landed, drop the entry mask so the X's glow isn't clipped
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!play) return;
    ScrollTrigger.refresh();
    const id = window.setTimeout(() => setSettled(true), 1700);
    return () => clearTimeout(id);
  }, [play]);

  const ease = [0.16, 1, 0.3, 1] as const;
  return (
    <section id="top" ref={root} className={`hero ${play ? "is-live" : ""} ${settled ? "is-settled" : ""}`} data-preset="hero">
      <div className="hero__hud" aria-hidden="true">
        <div className="hud hud--tl">
          <span>LAT 10.0265° N</span>
          <span>LON 76.3606° E</span>
        </div>
        <div className="hud hud--tr">
          <span className="hud__live">
            <i /> LIVE · <Clock />
          </span>
          <span>SIGNAL ▮▮▮▮▯</span>
        </div>
        <div className="hud hud--bl">
          <span>// CX-27</span>
          <span>RSET · ECE</span>
        </div>
        <div className="hud hud--br">
          <span>SCROLL TO DESCEND</span>
          <span className="hud__mouse">
            <i />
          </span>
        </div>
      </div>

      <div className="hero__inner">
        <motion.div
          className="hero__kicker"
          initial={{ opacity: 0, y: 20 }}
          animate={play ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease }}
        >
          <span className="chip">
            <i className="chip__dot" /> National Hardware Hackathon
          </span>
          <span className="hero__kicker-meta">
            {event.duration} · {event.city} · {event.dates}
          </span>
        </motion.div>

        <h1 className="hero__title" aria-label={`${event.name} ${event.year}`}>
          <span className="hero__word" aria-hidden="true">
            {WORD.map((c, i) => (
              <span className="hero__char-wrap" key={i}>
                <motion.span
                  className={`hero__char ${c === "X" ? "hero__char--x" : ""}`}
                  data-text={c}
                  initial={{ y: "115%", rotate: 8, opacity: 0 }}
                  animate={play ? { y: "0%", rotate: 0, opacity: 1 } : {}}
                  transition={{ duration: 1.1, delay: 0.1 + i * 0.06, ease }}
                >
                  {c}
                </motion.span>
              </span>
            ))}
          </span>
          <motion.span
            className="hero__year"
            aria-hidden="true"
            initial={{ opacity: 0, x: 60, filter: "blur(12px)" }}
            animate={play ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 1.2, delay: 0.6, ease }}
          >
            <span className="hero__year-line" />
            <span className="hero__year-num" data-text="2027">
              2027
            </span>
          </motion.span>
        </h1>

        <div className="hero__below">
          <p className="hero__tagline">
            <ScrambleText text={event.tagline} play={play} duration={1400} />
          </p>
          <motion.p
            className="hero__sub"
            initial={{ opacity: 0 }}
            animate={play ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 1.1 }}
          >
            42 hours. Three arenas. One national stage for builders of silicon, signals and sustainable tech —
            hosted by the Department of ECE, Rajagiri School of Engineering &amp; Technology.
          </motion.p>

          <motion.div
            className="hero__ctas"
            initial={{ opacity: 0, y: 30 }}
            animate={play ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 1.2, ease }}
          >
            <MagneticButton href={event.registerUrl} external cursor="GO">
              Register Now <span className="arrow">↗</span>
            </MagneticButton>
            <MagneticButton variant="ghost" onClick={() => scrollToTarget("#tracks", -40)}>
              Explore Tracks <span className="arrow">↓</span>
            </MagneticButton>
          </motion.div>

          <motion.ul
            className="hero__chips"
            initial="hide"
            animate={play ? "show" : "hide"}
            variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 1.5 } } }}
          >
            {tracks.map((t) => (
              <motion.li
                key={t.id}
                variants={{ hide: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                style={{ "--c": t.color } as React.CSSProperties}
              >
                <button type="button" onClick={() => scrollToTarget(`#track-${t.id}`, -120)}>
                  <span className="emoji">{t.emoji}</span>
                  <span>{t.name}</span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}

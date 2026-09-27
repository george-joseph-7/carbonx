import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { about, event, stats } from "../data/content";
import { gsap } from "../lib/scroll";
import { prefersReducedMotion } from "../lib/device";
import { Counter, SectionHeader, useTilt } from "./ui";

function ScrollLitText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const words = ref.current.querySelectorAll(".lit__w");
    if (prefersReducedMotion()) {
      words.forEach((w) => w.classList.add("is-on"));
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: 0.12, filter: "blur(3px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          stagger: 0.05,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top 80%", end: "bottom 45%", scrub: 0.5 },
        },
      );
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <p ref={ref} className="lit">
      {text.split(" ").map((w, i) => (
        <span key={i} className={`lit__w ${/CARBONX|VEGATHON|hardware|national|silicon,|signals|soil/i.test(w) ? "hl" : ""}`}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}

function Pillar({ k, v, i }: { k: string; v: string; i: number }) {
  const ref = useTilt<HTMLDivElement>(8);
  const icons = ["◈", "⬡", "◎"];
  return (
    <motion.div
      ref={ref}
      className="pillar"
      initial={{ opacity: 0, y: 40, rotateX: 20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="pillar__icon">{icons[i % icons.length]}</span>
      <h3>{k}</h3>
      <p>{v}</p>
      <span className="pillar__shine" aria-hidden="true" />
    </motion.div>
  );
}

export function About() {
  return (
    <section id="about" className="section about" data-preset="about">
      <div className="container">
        <SectionHeader
          index="01"
          eyebrow="THE REACTOR"
          title="More than a hackathon"
          accent="hackathon"
          description={<>Where hardware-first ideas are charged, stress-tested and shipped in 42 hours.</>}
        />
        <ScrollLitText text={about.lead} />

        <div className="about__grid">
          <motion.p
            className="about__body"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.9 }}
          >
            {about.body}
          </motion.p>
          <div className="about__pillars">
            {about.pillars.map((p, i) => (
              <Pillar key={p.k} k={p.k} v={p.v} i={i} />
            ))}
          </div>
        </div>

        <div className="lineage">
          <div className="lineage__rail" aria-hidden="true">
            <motion.span
              className="lineage__fill"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-20% 0px" }}
              transition={{ duration: 1.8, ease: [0.65, 0, 0.35, 1] }}
            />
          </div>
          {about.lineage.map((l, i) => (
            <motion.div
              key={l.year}
              className={`lineage__node ${i === about.lineage.length - 1 ? "is-now" : ""}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20% 0px" }}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.5 }}
            >
              <span className="lineage__dot" />
              <span className="lineage__year">{l.year}</span>
              <h4>{l.title}</h4>
              <p>{l.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="organizer"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.8 }}
        >
          <span className="organizer__label">Organised by</span>
          <p className="organizer__name">{event.organizer}</p>
          <p className="organizer__collab">{event.collaborators}</p>
        </motion.div>
      </div>
    </section>
  );
}

function Gauge({ i }: { i: number }) {
  return (
    <svg className="gauge" viewBox="0 0 120 120" aria-hidden="true">
      <circle className="gauge__bg" cx="60" cy="60" r="52" />
      <motion.circle
        className="gauge__fg"
        cx="60"
        cy="60"
        r="52"
        pathLength={1}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 0.35 + ((i * 0.23) % 0.6) }}
        viewport={{ once: true }}
        transition={{ duration: 2, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
      />
      {Array.from({ length: 36 }).map((_, k) => (
        <line
          key={k}
          className="gauge__tick"
          x1="60"
          y1="2"
          x2="60"
          y2={k % 3 === 0 ? 9 : 6}
          transform={`rotate(${k * 10} 60 60)`}
        />
      ))}
    </svg>
  );
}

export function Stats() {
  return (
    <section id="stats" className="section stats" data-preset="stats" aria-label="Event statistics">
      <div className="container">
        <div className="stats__grid">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="stat"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Gauge i={i} />
              <div className="stat__num">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="stat__label">{s.label}</div>
              <svg className="stat__osc" viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true">
                <path d={`M0 15 ${Array.from({ length: 20 }, (_, k) => `L${k * 10 + 5} ${15 + Math.sin(k * (1.1 + i * 0.4)) * (6 + i * 2)}`).join(" ")} L200 15`} />
              </svg>
            </motion.div>
          ))}
        </div>
        <p className="stats__note">Figures reflect the CarbonX 2026 edition's targets · 2027 numbers will be updated as registrations open.</p>
      </div>
    </section>
  );
}

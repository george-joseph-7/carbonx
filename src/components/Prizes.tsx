import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { prizes } from "../data/content";
import { prefersReducedMotion } from "../lib/device";
import { SectionHeader, useTilt } from "./ui";

/** Unannounced amounts stay "classified": digits keep scrambling behind a redaction bar. */
function Classified({ digits = 6 }: { digits?: number }) {
  const [s, setS] = useState("₹" + "0".repeat(digits));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      let out = "₹";
      for (let i = 0; i < digits; i++) out += Math.floor(Math.random() * 10);
      setS(out.replace(/(\d)(?=(\d\d)+\d$)/g, "$1,"));
    }, 70);
    return () => clearInterval(id);
  }, [digits]);
  return (
    <span className="classified" aria-label="To be announced">
      <span aria-hidden="true">{s}</span>
      <i aria-hidden="true">CLASSIFIED</i>
    </span>
  );
}

function PrizeCard({ place, label, amount, i }: { place: string; label: string; amount: string | null; i: number }) {
  const ref = useTilt<HTMLDivElement>(14);
  const champion = place === "1st";
  return (
    <motion.div
      className={`prize prize--${place}`}
      initial={{ opacity: 0, y: 120, rotateX: 40 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.2, delay: champion ? 0.5 : i * 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div ref={ref} className="prize__card">
        <div className="prize__holo" aria-hidden="true" />
        <span className="prize__place">{place}</span>
        <span className="prize__label">{label}</span>
        <div className="prize__amount">{amount ?? <Classified digits={champion ? 6 : 5} />}</div>
        <span className="prize__orb" aria-hidden="true" />
      </div>
      <div className="prize__plinth" aria-hidden="true" />
    </motion.div>
  );
}

export default function Prizes() {
  return (
    <section id="prizes" className="section prizes" data-preset="prizes">
      <div className="container">
        <SectionHeader
          index="05"
          eyebrow="THE STAKES"
          title="Charge up the podium"
          accent="podium"
          align="center"
          description="The 2027 prize pool is sealed until launch. Here's what's on the line."
        />
        <motion.div
          className="prizes__pool"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <span>Total prize pool</span>
          <strong>{prizes.pool ?? <Classified digits={7} />}</strong>
        </motion.div>
        <div className="prizes__podium">
          {prizes.podium.map((p, i) => (
            <PrizeCard key={p.place} {...p} i={i} />
          ))}
        </div>
        <ul className="prizes__perks">
          {prizes.perks.map((p, i) => (
            <motion.li
              key={p}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <span aria-hidden="true">✦</span>
              {p}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

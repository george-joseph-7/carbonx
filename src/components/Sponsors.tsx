import { motion } from "framer-motion";
import { orgEmails, pastPartners, sponsorTiers } from "../data/content";
import { MagneticButton, SectionHeader, useTilt } from "./ui";

const SPONSOR_MAIL = `mailto:${orgEmails[0]}?subject=${encodeURIComponent("CARBONX 2027 — Sponsorship enquiry")}`;

function Slot({
  tier,
  sponsor,
  i,
}: {
  tier: string;
  sponsor?: { name: string; logo?: string; url?: string };
  i: number;
}) {
  const ref = useTilt<HTMLAnchorElement>(tier === "title" ? 6 : 10);
  const content = sponsor ? (
    sponsor.logo ? (
      <img src={sponsor.logo} alt={sponsor.name} loading="lazy" />
    ) : (
      <span className="slot__name">{sponsor.name}</span>
    )
  ) : (
    <span className="slot__empty">
      <span className="slot__socket" aria-hidden="true">
        <i />
      </span>
      <span>{tier === "title" ? "Your brand, centre stage" : "Slot open"}</span>
    </span>
  );
  return (
    <motion.a
      ref={ref}
      href={sponsor?.url ?? SPONSOR_MAIL}
      target={sponsor?.url ? "_blank" : undefined}
      rel={sponsor?.url ? "noopener noreferrer" : undefined}
      className={`slot slot--${tier} ${sponsor ? "is-filled" : ""}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
      data-cursor={sponsor ? "VISIT" : "PITCH"}
    >
      <span className="slot__sheen" aria-hidden="true" />
      {content}
    </motion.a>
  );
}

export default function Sponsors() {
  return (
    <section id="sponsors" className="section sponsors" data-preset="sponsors">
      <div className="container">
        <SectionHeader
          index="07"
          eyebrow="POWERED BY"
          title="Sponsors of the future"
          accent="future"
          description="Put your brand in front of India's sharpest hardware builders. Five tiers, one unforgettable stage."
        />

        <div className="tiers">
          {sponsorTiers.map((t) => (
            <div key={t.tier} className={`tier tier--${t.tier}`}>
              <div className="tier__label">
                <span className="tier__gem" aria-hidden="true" />
                {t.label}
              </div>
              <div className="tier__slots">
                {Array.from({ length: Math.max(t.slots, t.sponsors.length) }).map((_, i) => (
                  <Slot key={i} tier={t.tier} sponsor={t.sponsors[i]} i={i} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <motion.div
          className="sponsors__cta"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <h3>Become a sponsor</h3>
            <p>Custom packages, workshops, hiring access and on-ground activations. Let's build something together.</p>
          </div>
          <MagneticButton href={SPONSOR_MAIL}>
            Get the sponsor deck <span className="arrow">↗</span>
          </MagneticButton>
        </motion.div>

        <div className="partners">
          <span className="partners__label">Partners from CarbonX 2026</span>
          <div className="partners__row">
            {pastPartners.map((p) =>
              p.url ? (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="partners__logo">
                  <img src={p.logo} alt={p.name} loading="lazy" />
                </a>
              ) : (
                <span key={p.name} className="partners__logo">
                  <img src={p.logo} alt={p.name} loading="lazy" />
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

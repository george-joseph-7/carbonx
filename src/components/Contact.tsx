import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { contacts, event, orgEmails, socials } from "../data/content";
import { gsap, scrollToTarget } from "../lib/scroll";
import { prefersReducedMotion } from "../lib/device";
import LogoMark from "./LogoMark";
import { MagneticButton, SectionHeader, useTilt } from "./ui";

function ContactCard({ c, i }: { c: (typeof contacts)[number]; i: number }) {
  const ref = useTilt<HTMLDivElement>(8);
  return (
    <motion.div
      ref={ref}
      className="ccard"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="ccard__role">{c.role}</span>
      <h3 className="ccard__name">{c.name}</h3>
      <a href={`tel:${c.tel}`} className="ccard__row">
        <span>Call</span>
        {c.phone}
      </a>
      <a href={`mailto:${c.email}`} className="ccard__row">
        <span>Mail</span>
        {c.email}
      </a>
      <span className="ccard__signal" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </motion.div>
  );
}

export function Contact() {
  return (
    <section id="contact" className="section contact" data-preset="contact">
      <div className="container">
        <SectionHeader
          index="08"
          eyebrow="OPEN CHANNEL"
          title="Talk to the core team"
          accent="core"
          description="For registrations, logistics, sponsorships and track-specific questions — the line is open."
        />
        <div className="contact__grid">
          {contacts.map((c, i) => (
            <ContactCard key={c.email} c={c} i={i} />
          ))}
        </div>

        <div className="contact__bottom">
          <motion.a
            className="venue"
            href={event.venue.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            data-cursor="MAP"
          >
            <div className="venue__radar" aria-hidden="true">
              <i />
              <i />
              <i />
              <b />
            </div>
            <div>
              <span className="venue__label">Venue</span>
              <h3>{event.venue.name}</h3>
              <p>{event.venue.address}</p>
              <span className="venue__link">Open in maps ↗</span>
            </div>
          </motion.a>

          <motion.div
            className="channels"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <span className="venue__label">IEDC &amp; IIC RSET</span>
            {orgEmails.map((m) => (
              <a key={m} href={`mailto:${m}`} className="channels__mail">
                {m}
              </a>
            ))}
            <div className="channels__socials">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".footer__giant span",
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: ".footer__giant", start: "top 95%", end: "bottom 80%", scrub: 0.8 },
        },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  // Each letter gets the spotlight position in its own coordinates, so the glow flows across the word
  const onGiantMove = (e: React.PointerEvent<HTMLDivElement>) => {
    for (const el of Array.from(e.currentTarget.children) as HTMLElement[]) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--fx", `${e.clientX - r.left}px`);
      el.style.setProperty("--fy", `${e.clientY - r.top}px`);
    }
  };

  return (
    <footer ref={ref} className="footer" data-preset="footer">
      <div className="container">
        <div className="footer__cta">
          <h2>
            Ready to <em>electrify</em> the future?
          </h2>
          <MagneticButton href={event.registerUrl} external cursor="GO">
            Register Now <span className="arrow">↗</span>
          </MagneticButton>
        </div>

        <div className="footer__cols">
          <div className="footer__brand">
            <LogoMark className="footer__logo" />
            <p>{event.organizer}</p>
            <p className="footer__muted">{event.collaborators}</p>
          </div>
          <nav className="footer__nav footer__nav--sections" aria-label="Footer">
            <span>Navigate</span>
            {["about", "tracks", "timeline", "prizes", "faq", "sponsors", "contact"].map((id) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTarget(`#${id}`, -40);
                }}
              >
                {id}
              </a>
            ))}
          </nav>
          <div className="footer__nav">
            <span>Follow</span>
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            ))}
          </div>
          <div className="footer__nav">
            <span>Reach</span>
            {orgEmails.map((m) => (
              <a key={m} href={`mailto:${m}`}>
                {m}
              </a>
            ))}
            <a href={event.venue.mapUrl} target="_blank" rel="noopener noreferrer">
              RSET, Kakkanad, Kochi
            </a>
          </div>
        </div>
      </div>

      <div className="footer__giant" onPointerMove={onGiantMove} aria-hidden="true">
        {"CARBONX".split("").map((c, i) => (
          <span key={i} data-text={c}>
            {c}
          </span>
        ))}
      </div>

      <div className="container footer__bar">
        <span>© 2027 CARBONX · Dept. of ECE, RSET</span>
        <span className="footer__status">
          <i /> All systems nominal
        </span>
        <button type="button" onClick={() => scrollToTarget(0)} className="footer__top">
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}

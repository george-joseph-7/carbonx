import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { event } from "../data/content";
import { scrollToTarget, lockScroll } from "../lib/scroll";
import LogoMark from "./LogoMark";

const LINKS = [
  { id: "about", label: "About" },
  { id: "tracks", label: "Tracks" },
  { id: "timeline", label: "Timeline" },
  { id: "prizes", label: "Prizes" },
  { id: "faq", label: "FAQ" },
  { id: "sponsors", label: "Sponsors" },
  { id: "contact", label: "Contact" },
];

export default function Nav({ visible }: { visible: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > last && y > 400);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    lockScroll(open);
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    window.setTimeout(() => scrollToTarget(`#${id}`, id === "top" ? 0 : -40), open ? 350 : 0);
  };

  return (
    <>
      <header
        className={`nav ${visible ? "is-visible" : ""} ${hidden && !open ? "is-hidden" : ""} ${scrolled ? "is-scrolled" : ""}`}
      >
        <a
          href="#top"
          className="nav__brand"
          onClick={(e) => {
            e.preventDefault();
            go("top");
          }}
          aria-label="CARBONX 2027 — back to top"
        >
          <LogoMark className="nav__logo" />
          <span className="nav__word">
            CARBON<b>X</b>
          </span>
          <span className="nav__year">’27</span>
        </a>
        <nav className="nav__links" aria-label="Sections">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={active === l.id ? "is-active" : ""}
              onClick={(e) => {
                e.preventDefault();
                go(l.id);
              }}
            >
              <span data-text={l.label}>{l.label}</span>
            </a>
          ))}
        </nav>
        <a className="nav__cta" href={event.registerUrl} target="_blank" rel="noopener noreferrer">
          <span className="nav__cta-dot" />
          Register
        </a>
        <button
          type="button"
          className={`nav__burger ${open ? "is-open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <i />
          <i />
        </button>
        <div className="nav__progress" aria-hidden="true" />
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="menu"
            initial={{ clipPath: "circle(0% at 92% 4%)" }}
            animate={{ clipPath: "circle(150% at 92% 4%)" }}
            exit={{ clipPath: "circle(0% at 92% 4%)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="menu__grid" aria-hidden="true" />
            <nav className="menu__links">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(l.id);
                  }}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <small>0{i + 1}</small>
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <motion.a
              className="menu__cta"
              href={event.registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Register Now →
            </motion.a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

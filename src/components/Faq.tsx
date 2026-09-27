import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { faqs } from "../data/content";
import { SectionHeader } from "./ui";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="section faq" data-preset="faq">
      <div className="container faq__wrap">
        <div className="faq__side">
          <SectionHeader
            index="06"
            eyebrow="QUERY / RESPONSE"
            title="Questions, decoded"
            accent="decoded"
            description={
              <>
                Can't find your answer? Ping the core team in the <a href="#contact">contact</a> section.
              </>
            }
          />
        </div>
        <div className="faq__list">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={f.q}
                className={`faq__item ${isOpen ? "is-open" : ""}`}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-5% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              >
                <button
                  type="button"
                  className="faq__q"
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="faq__idx">Q{String(i + 1).padStart(2, "0")}</span>
                  <span className="faq__text">{f.q}</span>
                  <span className="faq__icon" aria-hidden="true">
                    <i />
                    <i />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={`faq-a-${i}`}
                      className="faq__a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p>
                        <span className="faq__prompt" aria-hidden="true">
                          &gt;_
                        </span>
                        {f.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <span className="faq__scan" aria-hidden="true" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

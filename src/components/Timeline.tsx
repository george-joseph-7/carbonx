import { useEffect, useRef, useState } from "react";
import { timeline } from "../data/content";
import { gsap, ScrollTrigger, scrollToTarget } from "../lib/scroll";
import { prefersReducedMotion } from "../lib/device";
import { SectionHeader } from "./ui";

/**
 * Desktop: the section pins and the timeline travels horizontally as you scroll, with a
 * charged signal line filling up. Mobile: a vertical rail that fills on scroll.
 * Every node is clickable and jumps the scroll to that phase.
 */
export default function Timeline() {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const n = timeline.length;

  useEffect(() => {
    const el = root.current;
    const track = rail.current;
    if (!el || !track) return;
    const mm = gsap.matchMedia();

    mm.add("(min-width: 900px)", () => {
      if (prefersReducedMotion()) return;
      const dist = () => track.scrollWidth - window.innerWidth + 120;
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: el.querySelector(".tl__pin"),
          start: "top top",
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            el.style.setProperty("--tl-p", String(self.progress));
            setActive(Math.min(n - 1, Math.round(self.progress * (n - 1))));
          },
        },
      });
      stRef.current = tween.scrollTrigger ?? null;
      return () => {
        stRef.current = null;
      };
    });

    mm.add("(max-width: 899px)", () => {
      const st = ScrollTrigger.create({
        trigger: track,
        start: "top 70%",
        end: "bottom 60%",
        scrub: true,
        onUpdate: (self) => {
          el.style.setProperty("--tl-p", String(self.progress));
          setActive(Math.min(n - 1, Math.floor(self.progress * n)));
        },
      });
      return () => st.kill();
    });
    return () => mm.revert();
  }, [n]);

  const jump = (i: number) => {
    setActive(i);
    const st = stRef.current;
    if (st) scrollToTarget(st.start + ((st.end - st.start) * i) / (n - 1) + 2);
    else document.getElementById(`tl-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section id="timeline" ref={root} className="section tl" data-preset="timeline">
      <div className="tl__pin">
        <div className="container">
          <SectionHeader
            index="04"
            eyebrow="SIGNAL PATH"
            title="The road to launch"
            accent="launch"
            description="Seven phases from first signal to final demo. Scroll to travel the path — or tap any node."
          />
        </div>
        <div className="tl__viewport">
          <div className="tl__rail" ref={rail}>
            <div className="tl__line" aria-hidden="true">
              <span className="tl__line-fill" />
              <span className="tl__line-spark" />
            </div>
            {timeline.map((s, i) => (
              <button
                type="button"
                id={`tl-${i}`}
                key={s.title}
                className={`tl__node ${i === active ? "is-active" : ""} ${i < active ? "is-past" : ""}`}
                onClick={() => jump(i)}
                aria-current={i === active ? "step" : undefined}
              >
                <span className="tl__dot" aria-hidden="true">
                  <i />
                </span>
                <span className="tl__phase">
                  {s.phase} <em>{s.date}</em>
                </span>
                <span className="tl__title">{s.title}</span>
                <span className="tl__body">{s.body}</span>
                <span className="tl__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

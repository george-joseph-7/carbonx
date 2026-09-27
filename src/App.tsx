import { useCallback, useEffect, useState } from "react";
import BackgroundCanvas from "./components/BackgroundCanvas";
import Cursor from "./components/Cursor";
import Intro from "./components/Intro";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import CrossBands from "./components/CrossBands";
import { About, Stats } from "./components/About";
import Tracks from "./components/Tracks";
import Timeline from "./components/Timeline";
import Prizes from "./components/Prizes";
import Faq from "./components/Faq";
import Sponsors from "./components/Sponsors";
import { Contact, Footer } from "./components/Contact";
import { Seam } from "./components/ui";
import { initSmoothScroll, lockScroll, ScrollTrigger } from "./lib/scroll";
import { prefersReducedMotion } from "./lib/device";
import { setPreset } from "./three/sceneState";

export default function App() {
  const [revealed, setRevealed] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    initSmoothScroll(prefersReducedMotion());
    lockScroll(true);
  }, []);

  // Every section carries a data-preset; entering it re-tints / reshapes the WebGL world,
  // so scrolling feels like travelling through one continuous scene.
  useEffect(() => {
    const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-preset]")).map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => self.isActive && setPreset(el.dataset.preset!),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  const onReveal = useCallback(() => {
    setRevealed(true);
    document.documentElement.classList.add("is-revealed");
  }, []);
  const onDone = useCallback(() => {
    setIntroDone(true);
    lockScroll(false);
    ScrollTrigger.refresh();
  }, []);

  return (
    <>
      <BackgroundCanvas />
      <Cursor />
      {!introDone ? <Intro onReveal={onReveal} onDone={onDone} /> : null}
      <Nav visible={revealed} />
      <main className="page">
        <Hero play={revealed} />
        <CrossBands />
        <About />
        <Seam variant="pulse" label="// charging" />
        <Stats />
        <Seam variant="wave" label="// entering the arenas" />
        <Tracks />
        <Seam variant="circuit" label="// routing signal" />
        <Timeline />
        <Prizes />
        <Seam variant="wave" label="// decoding" />
        <Faq />
        <Sponsors />
        <Seam variant="circuit" label="// open channel" />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

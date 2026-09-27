import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { sceneState } from "../three/sceneState";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function initSmoothScroll(reduced: boolean) {
  if (lenis) return lenis;
  lenis = new Lenis({
    duration: reduced ? 0 : 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !reduced,
  });
  lenis.on("scroll", (e: Lenis) => {
    ScrollTrigger.update();
    sceneState.velocity = Math.max(sceneState.velocity, Math.abs(e.velocity));
    sceneState.progress = e.progress || 0;
    document.documentElement.style.setProperty("--scroll-progress", String(e.progress || 0));
  });
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToTarget(target: string | number, offset = 0) {
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.6 });
  else if (typeof target === "string") document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  else window.scrollTo({ top: target, behavior: "smooth" });
}

export function lockScroll(lock: boolean) {
  if (!lenis) return;
  if (lock) lenis.stop();
  else lenis.start();
  document.documentElement.classList.toggle("is-locked", lock);
}

export { gsap, ScrollTrigger };

import { useEffect, useRef } from "react";
import { isLowPower } from "../lib/device";
import { sceneState } from "../three/sceneState";

/** Fixed full-screen WebGL layer shared by every section. three.js is loaded lazily. */
export default function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let disposed = false;
    let dispose: (() => void) | undefined;
    import("../three/BackgroundScene")
      .then(({ BackgroundScene }) => {
        if (disposed || !ref.current) return;
        try {
          const scene = new BackgroundScene(ref.current, { lowPower: isLowPower() });
          dispose = () => scene.dispose();
          ref.current.classList.add("is-ready");
        } catch {
          // WebGL unavailable — the CSS aurora underneath carries the look
        }
      })
      .catch(() => {});

    const onMove = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      disposed = true;
      dispose?.();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="bg" aria-hidden="true">
      <div className="bg__aurora" />
      <canvas ref={ref} className="bg__canvas" />
      <div className="bg__vignette" />
      <div className="bg__grain" />
    </div>
  );
}

/**
 * Shared, mutable targets for the background WebGL scene. Sections write to `target`
 * as they scroll into view; the render loop eases the live values toward them. Kept
 * outside React so scroll handlers never trigger re-renders.
 */
export type ScenePreset = {
  /** 0 = lattice sphere, 1 = drifting field, 2 = signal wave plane */
  shape: number;
  colorA: string;
  colorB: string;
  /** Opacity of the C60 lattice mesh */
  lattice: number;
  /** Horizontal offset of the lattice (-1 left .. 1 right) */
  latticeX: number;
  energy: number;
};

export const presets: Record<string, ScenePreset> = {
  hero: { shape: 0, colorA: "#ff3b3b", colorB: "#3de8ff", lattice: 1, latticeX: 0.55, energy: 1 },
  about: { shape: 1, colorA: "#ff3b3b", colorB: "#7a5cff", lattice: 0.35, latticeX: -0.6, energy: 0.6 },
  stats: { shape: 2, colorA: "#ff6b3b", colorB: "#ff3b8a", lattice: 0.12, latticeX: 0, energy: 0.8 },
  tracks: { shape: 1, colorA: "#3dff9a", colorB: "#3de8ff", lattice: 0, latticeX: 0, energy: 0.7 },
  vegathon: { shape: 1, colorA: "#3dff9a", colorB: "#b6ff3d", lattice: 0, latticeX: 0, energy: 0.7 },
  signalthon: { shape: 2, colorA: "#3de8ff", colorB: "#7a5cff", lattice: 0, latticeX: 0, energy: 0.9 },
  electrothon: { shape: 1, colorA: "#ffb13d", colorB: "#ff3d6e", lattice: 0, latticeX: 0, energy: 1 },
  timeline: { shape: 2, colorA: "#3de8ff", colorB: "#ff3b3b", lattice: 0, latticeX: 0, energy: 0.6 },
  prizes: { shape: 0, colorA: "#ffd23d", colorB: "#ff3b3b", lattice: 0.5, latticeX: 0, energy: 1 },
  faq: { shape: 1, colorA: "#7a5cff", colorB: "#3de8ff", lattice: 0, latticeX: 0, energy: 0.4 },
  sponsors: { shape: 2, colorA: "#ffd23d", colorB: "#c0c8ff", lattice: 0.15, latticeX: 0.6, energy: 0.6 },
  contact: { shape: 1, colorA: "#ff3b3b", colorB: "#3de8ff", lattice: 0.25, latticeX: -0.55, energy: 0.5 },
  footer: { shape: 0, colorA: "#ff3b3b", colorB: "#ff8a3b", lattice: 0.8, latticeX: 0, energy: 0.9 },
};

export const sceneState = {
  target: { ...presets.hero },
  /** Normalised pointer, -1..1 */
  pointer: { x: 0, y: 0 },
  /** Absolute scroll velocity, decays in the render loop */
  velocity: 0,
  /** 0..1 page scroll progress */
  progress: 0,
  /** Brief flash when switching presets */
  pulse: 0,
  /** Skip rendering while something opaque covers the page (menu, track modal) */
  paused: false,
};

export function setPreset(name: keyof typeof presets | string) {
  const p = presets[name];
  if (!p) return;
  const changed = sceneState.target.colorA !== p.colorA || sceneState.target.shape !== p.shape;
  sceneState.target = { ...p };
  if (changed) sceneState.pulse = 1;
}

# CARBONX 2027

> Build. Innovate. Electrify the Future.

Website for **CARBONX 2027**, the 42-hour national hardware hackathon run by the Department of Electronics & Communication Engineering at Rajagiri School of Engineering & Technology (RSET), Kochi. There are three tracks: **Vegathon** 🌱, **Signalthon** 📡 and **Electrothon** ⚡.

## Stack

- **Vite + React 19 + TypeScript**
- **three.js**: a shared full-screen WebGL scene (a C60 carbon lattice, a GPU flow-field particle system and a signal wave plane) that morphs and recolours per section. It is lazy-loaded.
- **GSAP + ScrollTrigger**: scroll-scrubbed transitions, the pinned horizontal timeline, the hero scroll-out and the section seams.
- **Lenis**: smooth scrolling kept in sync with the GSAP ticker.
- **Framer Motion**: reveals, shared-layout track expansion, the menu and the FAQ.
- Canvas 2D for the cinematic intro and the three generative track animations.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

The output is a static site, so `dist/` can be deployed to Vercel, Netlify, GitHub Pages or any static host.

## Editing content

All copy lives in **`src/data/content.ts`**: event details, about text, stats, tracks, timeline, prizes, FAQ, sponsors, contacts and socials.

- **Prizes**: set `prizes.pool` and each `podium[].amount` to a string such as `"₹50,000"`. While a value is `null` it shows the animated "classified" redaction.
- **Sponsors**: push `{ name, logo, url }` into a tier's `sponsors` array and drop the logo in `public/sponsors/`. Empty slots render as "Slot open" cards that open a sponsorship email.
- **Timeline dates**: replace the `"TBA"` values once announced.
- **Stats**: currently the CarbonX 2026 targets. Update them for 2027.

Organizer, coordinator contacts, IEDC/IIC emails, socials, the KonfHub registration link, the C-DAC/ENAUTS partner logos and the VEGATHON → CARBONX history are carried over from the CarbonX 2026 site.

## Structure

```
src/
  App.tsx                 page composition + scroll-driven scene presets
  data/content.ts         all editable content
  three/BackgroundScene.ts  WebGL world (lattice, particles, waves, shaders)
  three/sceneState.ts     per-section palettes/shapes the scene eases toward
  lib/scroll.ts           Lenis + GSAP wiring
  components/
    Intro.tsx             cinematic particle intro (≈6s, skippable)
    Hero.tsx, CrossBands.tsx, About.tsx (About + Stats), Tracks.tsx,
    TrackCanvas.tsx, Timeline.tsx, Prizes.tsx, Faq.tsx, Sponsors.tsx,
    Contact.tsx (Contact + Footer), Nav.tsx, Cursor.tsx, LogoMark.tsx, ui.tsx
  styles/global.css       design tokens + all styling
```

## Performance & accessibility

- Phones, touch devices and low-core machines get fewer particles, a lower DPR, no grain and no backdrop blur.
- Track canvases animate only while on screen, and the WebGL loop pauses when the tab is hidden.
- `prefers-reduced-motion` shortens the intro to a fade and disables scrubbed and looping motion.
- The custom cursor appears only on fine pointers. All controls are real buttons and links with focus styles.

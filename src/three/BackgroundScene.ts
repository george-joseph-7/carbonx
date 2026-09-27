import * as THREE from "three";
import { sceneState } from "./sceneState";

const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uShape;
uniform float uEnergy;
uniform float uPixelRatio;
uniform float uSize;
uniform vec2 uMouse;
uniform vec3 uLattice;
uniform float uPulse;
attribute vec3 aSphere;
attribute vec3 aWave;
attribute float aSeed;
varying float vSeed;
varying float vAlpha;
varying float vGlow;
${NOISE_GLSL}
void main(){
  float t = uTime;
  float w0 = clamp(1.0 - abs(uShape - 0.0), 0.0, 1.0);
  float w1 = clamp(1.0 - abs(uShape - 1.0), 0.0, 1.0);
  float w2 = clamp(1.0 - abs(uShape - 2.0), 0.0, 1.0);

  // Shape 0: halo shell around the lattice, breathing
  vec3 s = aSphere * (1.0 + 0.08 * sin(t * 1.3 + aSeed * 12.0)) + uLattice;

  // Shape 1: drifting field — slow upward drift that wraps
  vec3 f = position;
  f.y = mod(f.y + t * (0.15 + aSeed * 0.25) + 8.0, 16.0) - 8.0;

  // Shape 2: signal wave plane
  vec3 wv = aWave;
  float wave = sin(wv.x * 0.55 + t * 1.4) * 0.9 + sin(wv.z * 0.7 - t * 0.9 + wv.x * 0.2) * 0.6;
  wv.y += wave;

  vec3 pos = s * w0 + f * w1 + wv * w2;

  // Flow-field turbulence
  float n = snoise(pos * 0.18 + vec3(0.0, t * 0.08, aSeed));
  float n2 = snoise(pos * 0.21 + vec3(t * 0.07, 3.1, aSeed * 2.0));
  pos += vec3(n, n2, n * n2) * (0.35 + uEnergy * 0.55 + uPulse * 1.5);

  // Pointer repulsion in the z~0 plane
  vec2 d = pos.xy - uMouse;
  float dist = length(d);
  float push = smoothstep(2.6, 0.0, dist) * (1.0 - smoothstep(-2.0, 4.0, abs(pos.z)));
  pos.xy += normalize(d + 0.0001) * push * 1.4;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = uSize * (0.35 + aSeed * 0.9) * (1.0 + push * 1.5);
  gl_PointSize = size * uPixelRatio * (12.0 / -mv.z);
  vSeed = aSeed;
  vAlpha = smoothstep(-26.0, -4.0, mv.z) * (0.45 + 0.55 * aSeed);
  vGlow = push + w2 * (wave * 0.25 + 0.25);
}`;

const particleFragment = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uPulse;
varying float vSeed;
varying float vAlpha;
varying float vGlow;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = smoothstep(0.5, 0.0, d);
  float strength = pow(core, 2.2);
  vec3 col = mix(uColorA, uColorB, smoothstep(0.2, 0.9, vSeed));
  col += vec3(1.0) * (vGlow * 0.35 + uPulse * 0.2) * strength;
  gl_FragColor = vec4(col, strength * vAlpha);
}`;

/** Truncated icosahedron (C60 / buckyball) vertices and edges */
function buckyball(radius: number) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const base: [number, number, number][] = [
    [0, 1, 3 * phi],
    [1, 2 + phi, 2 * phi],
    [phi, 2, 2 * phi + 1],
  ];
  const verts: THREE.Vector3[] = [];
  const key = (v: THREE.Vector3) => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
  const seen = new Set<string>();
  for (const [a, b, c] of base) {
    // even (cyclic) permutations
    const perms: [number, number, number][] = [
      [a, b, c],
      [b, c, a],
      [c, a, b],
    ];
    for (const [x, y, z] of perms) {
      for (const sx of [1, -1])
        for (const sy of [1, -1])
          for (const sz of [1, -1]) {
            const v = new THREE.Vector3(x * sx, y * sy, z * sz);
            const k = key(v);
            if (!seen.has(k)) {
              seen.add(k);
              verts.push(v);
            }
          }
    }
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++) {
      if (Math.abs(verts[i].distanceTo(verts[j]) - 2) < 0.01) edges.push([i, j]);
    }
  const scale = radius / verts[0].length();
  verts.forEach((v) => v.multiplyScalar(scale));
  return { verts, edges };
}

export interface BackgroundOptions {
  lowPower: boolean;
}

export class BackgroundScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private particles: THREE.Points;
  private particleMat: THREE.ShaderMaterial;
  private lattice = new THREE.Group();
  private latticeLines: THREE.LineSegments;
  private latticeNodes: THREE.Points;
  private ring: THREE.Mesh;
  private electrons: THREE.Points;
  private electronCount = 3;
  private last = performance.now();
  private elapsed = 0;
  private raf = 0;
  private running = true;
  private live = {
    shape: 0,
    colorA: new THREE.Color(),
    colorB: new THREE.Color(),
    lattice: 1,
    latticeX: 0.55,
    energy: 1,
    pulse: 0,
  };
  private mouse = new THREE.Vector2();
  private tmpA = new THREE.Color();
  private tmpB = new THREE.Color();

  constructor(canvas: HTMLCanvasElement, opts: BackgroundOptions) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !opts.lowPower,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.lowPower ? 1.25 : 1.75));
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this.camera.position.set(0, 0, 10);

    this.live.colorA.set(sceneState.target.colorA);
    this.live.colorB.set(sceneState.target.colorB);

    // ---------- particles ----------
    const count = opts.lowPower ? 2600 : 9000;
    const pos = new Float32Array(count * 3);
    const sphere = new Float32Array(count * 3);
    const wave = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const cols = Math.ceil(Math.sqrt(count * 2.2));
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = -Math.random() * 16 + 3;

      // fibonacci shell with some thickness
      const k = i + 0.5;
      const phiA = Math.acos(1 - (2 * k) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * k;
      const r = 3.2 + Math.pow(Math.random(), 3) * 3.5;
      sphere[i * 3] = Math.cos(theta) * Math.sin(phiA) * r;
      sphere[i * 3 + 1] = Math.sin(theta) * Math.sin(phiA) * r;
      sphere[i * 3 + 2] = Math.cos(phiA) * r;

      const gx = i % cols;
      const gz = Math.floor(i / cols);
      wave[i * 3] = (gx / cols - 0.5) * 34;
      wave[i * 3 + 1] = -3.2;
      wave[i * 3 + 2] = -(gz / (count / cols)) * 20 + 4;

      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSphere", new THREE.BufferAttribute(sphere, 3));
    geo.setAttribute("aWave", new THREE.BufferAttribute(wave, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    this.particleMat = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uShape: { value: 0 },
        uEnergy: { value: 1 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uSize: { value: opts.lowPower ? 7 : 6 },
        uMouse: { value: new THREE.Vector2(99, 99) },
        uLattice: { value: new THREE.Vector3() },
        uPulse: { value: 0 },
        uColorA: { value: this.live.colorA },
        uColorB: { value: this.live.colorB },
      },
    });
    this.particles = new THREE.Points(geo, this.particleMat);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);

    // ---------- C60 lattice ----------
    const { verts, edges } = buckyball(2.3);
    const linePos = new Float32Array(edges.length * 6);
    const lineProg = new Float32Array(edges.length * 2);
    edges.forEach(([a, b], i) => {
      linePos.set([verts[a].x, verts[a].y, verts[a].z, verts[b].x, verts[b].y, verts[b].z], i * 6);
      lineProg.set([0, 1], i * 2);
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute("aProg", new THREE.BufferAttribute(lineProg, 1));
    const edgeSeed = new Float32Array(edges.length * 2);
    edges.forEach((_, i) => {
      const s = Math.random();
      edgeSeed[i * 2] = s;
      edgeSeed[i * 2 + 1] = s;
    });
    lineGeo.setAttribute("aSeed", new THREE.BufferAttribute(edgeSeed, 1));
    const lineMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uColorA: { value: this.live.colorA },
        uColorB: { value: this.live.colorB },
      },
      vertexShader: /* glsl */ `
        attribute float aProg; attribute float aSeed;
        varying float vProg; varying float vSeed; varying float vDepth;
        void main(){ vProg=aProg; vSeed=aSeed;
          vec4 mv = modelViewMatrix*vec4(position,1.0); vDepth = mv.z;
          gl_Position = projectionMatrix*mv; }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uOpacity; uniform vec3 uColorA; uniform vec3 uColorB;
        varying float vProg; varying float vSeed; varying float vDepth;
        void main(){
          float head = fract(uTime*0.35 + vSeed);
          float spark = smoothstep(0.12, 0.0, abs(vProg-head));
          vec3 col = mix(uColorA*0.9, vec3(1.0), spark*0.8);
          float depthFade = smoothstep(-14.0, -6.0, vDepth);
          gl_FragColor = vec4(col, (0.35 + spark*0.9) * uOpacity * (0.35+0.65*depthFade));
        }`,
    });
    this.latticeLines = new THREE.LineSegments(lineGeo, lineMat);
    this.lattice.add(this.latticeLines);

    const nodeGeo = new THREE.BufferGeometry().setFromPoints(verts);
    const nodeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 1 },
        uColor: { value: this.live.colorA },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
      },
      vertexShader: /* glsl */ `uniform float uPixelRatio; varying float vDepth;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vDepth=mv.z; gl_Position=projectionMatrix*mv; gl_PointSize = 26.0*uPixelRatio*(8.0/-mv.z);} `,
      fragmentShader: /* glsl */ `uniform float uOpacity; uniform vec3 uColor; varying float vDepth;
        void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); a=pow(a,2.5);
          float c = smoothstep(0.12,0.0,d);
          gl_FragColor=vec4(mix(uColor,vec3(1.0),c), a*uOpacity*(0.4+0.6*smoothstep(-14.0,-6.0,vDepth))); }`,
    });
    this.latticeNodes = new THREE.Points(nodeGeo, nodeMat);
    this.lattice.add(this.latticeNodes);

    // orbit ring, echoing the CarbonX logo
    const ringGeo = new THREE.TorusGeometry(3.6, 0.018, 8, 180);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.live.colorA,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.scale.set(1, 0.34, 1);
    this.ring.rotation.set(0, 0, -0.32);
    this.lattice.add(this.ring);

    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.electronCount * 3), 3));
    const eMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.28,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.glowTexture(),
    });
    this.electrons = new THREE.Points(eGeo, eMat);
    this.ring.add(this.electrons);

    this.scene.add(this.lattice);

    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.loop();
  }

  private glowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.6)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  private onVisibility = () => {
    this.running = !document.hidden;
    if (this.running) {
      this.last = performance.now();
      this.loop();
    } else cancelAnimationFrame(this.raf);
  };

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Pull the camera back on portrait screens so the lattice stays framed
    this.camera.position.z = w / h < 0.8 ? 14 : 10;
    this.camera.updateProjectionMatrix();
  };

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.elapsed += dt;
    const t = this.elapsed;
    const L = this.live;
    const T = sceneState.target;
    const ease = 1 - Math.pow(0.04, dt); // frame-rate independent lerp

    L.shape += (T.shape - L.shape) * ease * 0.9;
    L.lattice += (T.lattice - L.lattice) * ease;
    L.latticeX += (T.latticeX - L.latticeX) * ease * 0.8;
    L.energy += (T.energy + Math.min(sceneState.velocity * 0.02, 1.5) - L.energy) * ease;
    this.tmpA.set(T.colorA);
    this.tmpB.set(T.colorB);
    L.colorA.lerp(this.tmpA, ease);
    L.colorB.lerp(this.tmpB, ease);
    sceneState.pulse *= Math.pow(0.02, dt);
    sceneState.velocity *= Math.pow(0.05, dt);

    // pointer → world (z=0 plane)
    const vFov = (this.camera.fov * Math.PI) / 180;
    const hh = Math.tan(vFov / 2) * this.camera.position.z;
    const hw = hh * this.camera.aspect;
    this.mouse.set(sceneState.pointer.x * hw, sceneState.pointer.y * hh);

    const u = this.particleMat.uniforms;
    u.uTime.value = t;
    u.uShape.value = L.shape;
    u.uEnergy.value = L.energy;
    u.uPulse.value = sceneState.pulse;
    (u.uMouse.value as THREE.Vector2).lerp(this.mouse, ease * 2);

    // lattice placement: sits to the side on wide screens, centred on narrow ones
    const narrow = this.camera.aspect < 0.9;
    const lx = narrow ? 0 : L.latticeX * hw * 0.72;
    const ly = narrow ? hh * 0.18 : -hh * 0.1;
    this.lattice.position.x += (lx - this.lattice.position.x) * ease;
    this.lattice.position.y += (ly - this.lattice.position.y) * ease;
    (u.uLattice.value as THREE.Vector3).copy(this.lattice.position);
    const s = 0.85 + L.lattice * 0.25 + Math.sin(t * 0.8) * 0.02 + sceneState.pulse * 0.08;
    this.lattice.scale.setScalar(s * (narrow ? 0.8 : 1));
    this.lattice.rotation.y = t * 0.18 + sceneState.pointer.x * 0.5 + sceneState.progress * 6;
    this.lattice.rotation.x = Math.sin(t * 0.13) * 0.3 - sceneState.pointer.y * 0.35;
    this.lattice.visible = L.lattice > 0.01;
    this.ring.rotation.y = -this.lattice.rotation.y * 0.6;

    (this.latticeLines.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    (this.latticeLines.material as THREE.ShaderMaterial).uniforms.uOpacity.value = L.lattice;
    (this.latticeNodes.material as THREE.ShaderMaterial).uniforms.uOpacity.value = L.lattice;
    const ringMat = this.ring.material as THREE.MeshBasicMaterial;
    ringMat.opacity = 0.75 * L.lattice;
    ringMat.color.copy(L.colorA);
    (this.electrons.material as THREE.PointsMaterial).opacity = L.lattice;
    const ep = this.electrons.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.electronCount; i++) {
      const a = t * (1.2 + i * 0.25) + (i * Math.PI * 2) / this.electronCount;
      ep.setXYZ(i, Math.cos(a) * 3.6, Math.sin(a) * 3.6, 0);
    }
    ep.needsUpdate = true;

    // subtle camera parallax
    this.camera.position.x += (sceneState.pointer.x * 0.6 - this.camera.position.x) * ease * 0.5;
    this.camera.position.y += (sceneState.pointer.y * 0.4 - this.camera.position.y) * ease * 0.5;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
  }
}

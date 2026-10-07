import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
} from 'three'

/*
 * The contact assistant: a living sphere. Its surface is displaced on the GPU by layered
 * simplex noise; normals are rebuilt from the displaced surface so the lighting, fresnel rim
 * and iridescence follow every ripple. Conversation state (idle, listening, thinking,
 * speaking, success, error) only moves *targets*; each frame eases the rendered state toward
 * them with frame-rate independent damping, so transitions never pop.
 */

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error'

export interface OrbSceneOptions {
  canvas: HTMLCanvasElement
  dark: boolean
  reducedMotion: boolean
}

interface Profile {
  amp: number
  freq: number
  speed: number
  energy: number
  spin: number
  glow: number
  mood: number
}

const PROFILES: Record<OrbState, Profile> = {
  idle: { amp: 0.11, freq: 1.25, speed: 0.3, energy: 0, spin: 0.12, glow: 0.55, mood: 0 },
  listening: { amp: 0.13, freq: 1.4, speed: 0.42, energy: 0.08, spin: 0.22, glow: 0.7, mood: 0 },
  thinking: { amp: 0.19, freq: 2.2, speed: 1.15, energy: 0.15, spin: 0.95, glow: 0.8, mood: 0 },
  speaking: { amp: 0.14, freq: 1.55, speed: 0.65, energy: 1, spin: 0.32, glow: 0.9, mood: 0 },
  success: { amp: 0.17, freq: 1.1, speed: 0.45, energy: 0.25, spin: 0.5, glow: 1, mood: 1 },
  error: { amp: 0.24, freq: 3, speed: 1.5, energy: 0.1, spin: 0.2, glow: 0.7, mood: 0 },
}

/** Brand hues in sRGB, approximated from the oklch tokens. */
const EMBER = 0xf2622e
const VOLT = 0xe3ec4f
const COBALT = 0x2d4fe0
const BLUSH = 0xf3a3ae
const MINT = 0x7fdcbc

// Ashima Arts / Stefan Gustavson 3D simplex noise (MIT).
const SIMPLEX = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

const ORB_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform float uSpeed;
uniform float uEnergy;
uniform float uImpulse;
uniform float uPhase;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;
varying float vDisp;

${SIMPLEX}

float displace(vec3 p) {
  float t = uPhase;
  float n = snoise(p * uFreq + vec3(t, t * 0.6, -t * 0.4));
  n += snoise(p * uFreq * 2.3 - vec3(t * 1.3)) * 0.35;
  // Speech: travelling bands plus fine chatter, scaled by the voice envelope.
  float bands = sin(p.y * 8.0 + uTime * 9.0) * 0.5 + 0.5;
  float talk = uEnergy * (0.07 * bands + 0.06 * snoise(p * 4.2 + uTime * 3.4));
  // Keystrokes: a quick, sharp shiver.
  float shiver = uImpulse * 0.11 * snoise(p * 3.1 + uTime * 6.0);
  return n * uAmp + talk + shiver;
}

void main() {
  vec3 p = position;
  vec3 n = normalize(p);
  vec3 tangent = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 bitangent = normalize(cross(n, tangent));
  float eps = 0.012;

  float d = displace(p);
  vec3 displaced = p + n * d;
  vec3 pt = normalize(p + tangent * eps);
  vec3 pb = normalize(p + bitangent * eps);
  vec3 dt = pt + pt * displace(pt);
  vec3 db = pb + pb * displace(pb);
  vec3 rebuilt = normalize(cross(dt - displaced, db - displaced));

  vNormal = normalize(normalMatrix * rebuilt);
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vView = normalize(-mv.xyz);
  vPos = displaced;
  vDisp = d;
  gl_Position = projectionMatrix * mv;
}
`

const ORB_FRAGMENT = /* glsl */ `
uniform vec3 uEmber;
uniform vec3 uVolt;
uniform vec3 uCobalt;
uniform vec3 uBlush;
uniform vec3 uMint;
uniform float uTime;
uniform float uGlow;
uniform float uMood;
uniform float uAlert;
uniform float uDark;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;
varying float vDisp;

vec3 iridescence(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float facing = max(dot(N, V), 0.0);
  float fresnel = pow(1.0 - facing, 2.6);

  // Cobalt underside → ember body → volt crest, pushed around by the displacement.
  float g = clamp(vPos.y * 0.42 + 0.5 + vDisp * 1.8, 0.0, 1.0);
  vec3 base = mix(uCobalt, uEmber, smoothstep(0.12, 0.72, g));
  base = mix(base, uVolt, smoothstep(0.7, 1.0, g) * 0.75);
  base = mix(base, uBlush, smoothstep(0.25, 0.7, fresnel) * 0.4);
  base = mix(base, mix(uMint, uVolt, g * 0.5), uMood);

  vec3 L = normalize(vec3(-0.55, 0.75, 0.65));
  vec3 L2 = normalize(vec3(0.7, -0.3, 0.4));
  float diffuse = max(dot(N, L), 0.0);
  float fill = max(dot(N, L2), 0.0) * 0.35;
  vec3 H = normalize(L + V);
  float specular = pow(max(dot(N, H), 0.0), 56.0);

  vec3 color = base * (0.28 + 0.78 * diffuse + fill);
  color += specular * mix(vec3(1.0), uVolt, 0.25) * 0.75;
  color += iridescence(fresnel * 0.9 + vDisp * 2.2 + uTime * 0.04) * fresnel * 0.32;
  color += fresnel * mix(uBlush, vec3(1.0), 0.45) * (0.25 + uGlow * 0.45) * mix(0.75, 1.0, uDark);
  color = mix(color, vec3(0.92, 0.22, 0.16) * (0.35 + diffuse), uAlert * 0.55);

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const HALO_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const HALO_FRAGMENT = /* glsl */ `
uniform vec3 uInner;
uniform vec3 uOuter;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float d = distance(vUv, vec2(0.5)) * 2.0;
  float a = pow(smoothstep(1.0, 0.18, d), 2.2) * uOpacity;
  gl_FragColor = vec4(mix(uInner, uOuter, smoothstep(0.2, 0.9, d)), a);
  #include <colorspace_fragment>
}
`

const DUST_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uBurst;
uniform float uPixelRatio;
attribute float aSeed;
varying float vAlpha;
void main() {
  vec3 p = position;
  float angle = uTime * (0.08 + aSeed * 0.12);
  float c = cos(angle), s = sin(angle);
  p = vec3(c * p.x - s * p.z, p.y + sin(uTime * 0.6 + aSeed * 6.28) * 0.05, s * p.x + c * p.z);
  p *= 1.0 + uBurst * (0.35 + aSeed * 0.5);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (2.0 + aSeed * 3.0) * uPixelRatio * (3.0 / -mv.z);
  vAlpha = 0.35 + 0.65 * fract(aSeed * 7.13 + uTime * 0.12);
  gl_Position = projectionMatrix * mv;
}
`

const DUST_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vAlpha * uOpacity);
  #include <colorspace_fragment>
}
`

/** Deterministic PRNG so the particle shell is identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class OrbScene {
  readonly ready: Promise<void>

  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(32, 1, 0.1, 50)
  private readonly rig = new Group()
  private readonly orb: Mesh<IcosahedronGeometry, ShaderMaterial>
  private readonly halo: Mesh<PlaneGeometry, ShaderMaterial>
  private readonly dust: Points<BufferGeometry, ShaderMaterial>
  private readonly rings: Mesh<TorusGeometry, MeshBasicMaterial>[] = []

  private readonly target: Profile = { ...PROFILES.idle }
  private readonly current: Profile = { ...PROFILES.idle }
  private readonly pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  private impulse = 0
  private burst = 0
  private alert = 0
  private phase = 0
  private elapsed = 0
  private lastTime = 0
  private running = false
  private wantsRunning = true
  private invalidated = false
  private disposed = false
  private reducedMotion: boolean
  private resolveReady!: () => void

  constructor({ canvas, dark, reducedMotion }: OrbSceneOptions) {
    this.reducedMotion = reducedMotion
    this.ready = new Promise((resolve) => (this.resolveReady = resolve))

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    canvas.addEventListener('webglcontextlost', this.onContextLost)

    this.camera.position.set(0, 0, 6.4)

    // Fewer vertices on small canvases: the noise runs three times per vertex.
    const detail = canvas.clientWidth > 0 && canvas.clientWidth < 420 ? 28 : 40
    this.orb = new Mesh(
      new IcosahedronGeometry(1, detail),
      new ShaderMaterial({
        vertexShader: ORB_VERTEX,
        fragmentShader: ORB_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uPhase: { value: 0 },
          uAmp: { value: PROFILES.idle.amp },
          uFreq: { value: PROFILES.idle.freq },
          uSpeed: { value: PROFILES.idle.speed },
          uEnergy: { value: 0 },
          uImpulse: { value: 0 },
          uGlow: { value: PROFILES.idle.glow },
          uMood: { value: 0 },
          uAlert: { value: 0 },
          uDark: { value: dark ? 1 : 0 },
          uEmber: { value: new Color(EMBER) },
          uVolt: { value: new Color(VOLT) },
          uCobalt: { value: new Color(COBALT) },
          uBlush: { value: new Color(BLUSH) },
          uMint: { value: new Color(MINT) },
        },
      }),
    )

    this.halo = new Mesh(
      new PlaneGeometry(5.2, 5.2),
      new ShaderMaterial({
        vertexShader: HALO_VERTEX,
        fragmentShader: HALO_FRAGMENT,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uInner: { value: new Color(EMBER) },
          uOuter: { value: new Color(BLUSH) },
          uOpacity: { value: 0.5 },
        },
      }),
    )
    this.halo.position.z = -1.2

    const random = mulberry32(11)
    const count = 520
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const radius = 1.5 + random() * 0.9
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.8
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
      seeds[i] = random()
    }
    const dustGeometry = new BufferGeometry()
    dustGeometry.setAttribute('position', new BufferAttribute(positions, 3))
    dustGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
    this.dust = new Points(
      dustGeometry,
      new ShaderMaterial({
        vertexShader: DUST_VERTEX,
        fragmentShader: DUST_FRAGMENT,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uBurst: { value: 0 },
          uPixelRatio: { value: 1 },
          uColor: { value: new Color(0xffffff) },
          uOpacity: { value: 0.8 },
        },
      }),
    )

    for (const [radius, tube, tilt] of [
      [1.48, 0.0045, [1.15, 0.2, 0.15]],
      [1.72, 0.003, [1.35, -0.45, -0.3]],
    ] as const) {
      const ring = new Mesh(
        new TorusGeometry(radius, tube, 6, 256),
        new MeshBasicMaterial({ transparent: true, opacity: 0.4, depthWrite: false }),
      )
      ring.rotation.set(tilt[0], tilt[1], tilt[2])
      this.rings.push(ring)
      this.rig.add(ring)
    }

    this.rig.add(this.orb, this.dust)
    this.scene.add(this.halo, this.rig)
    this.setTheme(dark)
    void this.warmUp()
  }

  // ───────────────────────── Public API ─────────────────────────

  setSize(width: number, height: number) {
    if (this.disposed || width === 0 || height === 0) return
    const ratio = Math.min(window.devicePixelRatio, width < 420 ? 1.5 : 2)
    this.renderer.setPixelRatio(ratio)
    this.renderer.setSize(width, height, false)
    this.dust.material.uniforms.uPixelRatio!.value = ratio
    this.camera.aspect = width / height
    // Keep the whole sphere, rings and halo in frame on tall and wide canvases alike.
    this.camera.position.z = width / height < 1 ? 6.4 / Math.max(0.75, width / height) : 6.4
    this.camera.updateProjectionMatrix()
    this.invalidate()
  }

  setState(state: OrbState) {
    Object.assign(this.target, PROFILES[state])
    if (state === 'success') this.burst = 1
    if (state === 'error') this.alert = 1
    this.invalidate()
  }

  /** A keystroke or a click: a brief shiver that decays on its own. */
  pulse(strength = 0.6) {
    this.impulse = Math.min(1, this.impulse + strength)
    this.invalidate()
  }

  /** Pointer in normalised coordinates (-1…1) relative to the canvas. */
  setPointer(x: number, y: number) {
    this.pointer.tx = MathUtils.clamp(x, -1, 1)
    this.pointer.ty = MathUtils.clamp(y, -1, 1)
  }

  setTheme(dark: boolean) {
    this.orb.material.uniforms.uDark!.value = dark ? 1 : 0
    const halo = this.halo.material
    halo.blending = dark ? AdditiveBlending : NormalBlending
    halo.uniforms.uOpacity!.value = dark ? 0.55 : 0.32
    halo.needsUpdate = true
    const dust = this.dust.material
    dust.blending = dark ? AdditiveBlending : NormalBlending
    ;(dust.uniforms.uColor!.value as Color).setHex(dark ? 0xf4ede3 : 0x2a211b)
    dust.uniforms.uOpacity!.value = dark ? 0.8 : 0.45
    dust.needsUpdate = true
    for (const ring of this.rings) {
      ring.material.color.setHex(dark ? 0xf4ede3 : 0x2a211b)
      ring.material.opacity = dark ? 0.32 : 0.22
    }
    this.invalidate()
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced
    this.updateLoop()
  }

  setActive(active: boolean) {
    this.wantsRunning = active
    this.updateLoop()
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost)
    this.orb.geometry.dispose()
    this.orb.material.dispose()
    this.halo.geometry.dispose()
    this.halo.material.dispose()
    this.dust.geometry.dispose()
    this.dust.material.dispose()
    for (const ring of this.rings) {
      ring.geometry.dispose()
      ring.material.dispose()
    }
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }

  // ───────────────────────── Internals ─────────────────────────

  private async warmUp() {
    if (this.renderer.extensions.has('KHR_parallel_shader_compile')) {
      try {
        await this.renderer.compileAsync(this.scene, this.camera)
      } catch {
        // First render compiles synchronously instead.
      }
    }
    if (this.disposed) return
    this.step(0, true)
    this.renderer.render(this.scene, this.camera)
    this.resolveReady()
    this.updateLoop()
  }

  private readonly onContextLost = (event: Event) => {
    event.preventDefault()
    this.renderer.setAnimationLoop(null)
    this.running = false
  }

  private updateLoop() {
    if (this.disposed) return
    const shouldRun = this.wantsRunning && !this.reducedMotion
    if (shouldRun && !this.running) {
      this.running = true
      this.lastTime = performance.now()
      this.renderer.setAnimationLoop(this.onFrame)
    } else if (!shouldRun && this.running) {
      this.running = false
      this.renderer.setAnimationLoop(null)
    }
    if (!shouldRun) this.invalidate()
  }

  /** Reduced motion: one settled frame per change, nothing in between. */
  private invalidate() {
    if (this.running || this.invalidated || this.disposed) return
    this.invalidated = true
    requestAnimationFrame(() => {
      this.invalidated = false
      if (this.disposed) return
      this.step(0, true)
      this.renderer.render(this.scene, this.camera)
    })
  }

  private readonly onFrame = (time: number) => {
    const dt = Math.min((time - this.lastTime) / 1000, 1 / 20)
    this.lastTime = time
    this.step(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private step(dt: number, snap = false) {
    const { current, target } = this
    const damp = (from: number, to: number, lambda: number) => (snap ? to : MathUtils.damp(from, to, lambda, dt))

    for (const key of Object.keys(target) as (keyof Profile)[]) current[key] = damp(current[key], target[key], 3.2)
    this.impulse = snap ? 0 : this.impulse * Math.exp(-dt * 5.5)
    this.burst = snap ? 0 : this.burst * Math.exp(-dt * 2.4)
    this.alert = snap ? 0 : this.alert * Math.exp(-dt * 2.8)
    this.pointer.x = damp(this.pointer.x, this.pointer.tx, 2.6)
    this.pointer.y = damp(this.pointer.y, this.pointer.ty, 2.6)

    this.elapsed += dt
    // Integrate the noise phase so speed changes never jump the surface.
    this.phase += dt * current.speed
    const t = this.elapsed

    // A voice-like envelope: syllables (fast) riding on phrases (slow).
    const syllables = Math.abs(Math.sin(t * 11.3)) * 0.6 + Math.abs(Math.sin(t * 7.1 + 1.3)) * 0.4
    const phrase = 0.55 + 0.45 * Math.sin(t * 1.7)
    const voice = current.energy * (0.35 + 0.65 * syllables * phrase)

    const orb = this.orb.material.uniforms
    orb.uTime!.value = t
    orb.uPhase!.value = this.phase
    orb.uAmp!.value = current.amp + this.burst * 0.12
    orb.uFreq!.value = current.freq
    orb.uEnergy!.value = voice
    orb.uImpulse!.value = this.impulse
    orb.uGlow!.value = current.glow
    orb.uMood!.value = current.mood
    orb.uAlert!.value = this.alert

    // Breathing, plus a touch of swell on every syllable and keystroke.
    const breath = 1 + Math.sin(t * 1.5) * 0.018 + voice * 0.035 + this.impulse * 0.03 + this.burst * 0.06
    this.rig.scale.setScalar(breath)
    this.rig.rotation.x = this.pointer.y * 0.28 + Math.sin(t * 0.3) * 0.05
    this.rig.rotation.y = this.pointer.x * 0.4 + t * 0.05
    this.rig.position.x = Math.sin(t * 55) * 0.025 * this.alert

    this.rings[0]!.rotation.z += dt * current.spin
    this.rings[1]!.rotation.z -= dt * current.spin * 0.7

    this.halo.material.uniforms.uOpacity!.value =
      (this.halo.material.blending === AdditiveBlending ? 0.45 : 0.26) * (0.75 + current.glow * 0.4 + voice * 0.3)
    this.halo.scale.setScalar(1 + voice * 0.08 + this.burst * 0.25)

    const dust = this.dust.material.uniforms
    dust.uTime!.value = t * (0.6 + current.spin)
    dust.uBurst!.value = this.burst
  }
}

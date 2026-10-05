import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  EllipseCurve,
  ExtrudeGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'

import { MARK_HEIGHT, MARK_WIDTH, type MarkPiece, markPieces } from '@/lib/mark'

/*
 * The hero symbol: the MZ monogram's six strokes, extruded and lit like machined metal.
 *
 * Inputs (all normalised) are written to `targets` by the host component; every frame the
 * rendered `state` eases toward them with frame-rate independent damping, so scroll,
 * pointer and "hold to scatter" all blend instead of fighting.
 */

export interface SymbolSceneOptions {
  canvas: HTMLCanvasElement
  dark: boolean
  reducedMotion: boolean
}

interface PieceRig {
  mesh: Mesh
  home: Vector3
  scatter: Vector3
  spin: Vector3
}

interface Theme {
  body: number
  lines: number
  lineOpacity: number
  particles: number
  exposure: number
  env: number
}

const THEMES: Record<'dark' | 'light', Theme> = {
  dark: { body: 0x2a221d, lines: 0xf4ede3, lineOpacity: 0.13, particles: 0xf4ede3, exposure: 1.05, env: 0.9 },
  light: { body: 0xe8e0d4, lines: 0x2a211b, lineOpacity: 0.14, particles: 0x2a211b, exposure: 0.95, env: 1.1 },
}

/** Brand hues, approximated in sRGB from the oklch tokens. */
const EMBER = 0xf2622e
const COBALT = 0x2d4fe0
const VOLT = 0xe6f052

/** World-space width of the assembled monogram (the logo is roughly 1.95 : 1). */
const MARK_WORLD_WIDTH = 4.6
const MARK_SCALE = MARK_WORLD_WIDTH / MARK_WIDTH

/** Per-stroke depth offsets and tumble axes when the mark comes apart (markPieces order). */
const SCATTER_DEPTH = [0.9, -0.55, 0.7, -0.6, 1.1, 0.5]
const SPIN_AXES = [
  new Vector3(0.6, 0.25, -0.5),
  new Vector3(-0.3, 0.8, 0.35),
  new Vector3(0.45, -0.6, 0.3),
  new Vector3(-0.7, 0.2, 0.55),
  new Vector3(0.2, 0.9, -0.3),
  new Vector3(-0.5, -0.35, 0.7),
]

const ORBITS = [
  { rx: 7.6, ry: 2.5, rotation: [1.12, 0.18, -0.34] },
  { rx: 10.2, ry: 3.8, rotation: [1.28, -0.42, 0.52] },
  { rx: 5.8, ry: 5.1, rotation: [0.42, 0.92, 0.2] },
] as const

/** Deterministic PRNG so the particle field is identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

const svgLoader = new SVGLoader()

/**
 * Turns one SVG stroke into an extruded, bevelled solid in world units: parsed with
 * SVGLoader, sampled into a polyline (curves included), re-centred on the logo and flipped
 * from SVG's y-down into three's y-up space. ExtrudeGeometry normalises the winding.
 */
function createPieceGeometry(piece: MarkPiece) {
  const data = svgLoader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${piece.d}"/></svg>`)
  // One subpath per stroke, so toShapes() returns it as a solid without hole detection.
  const shapes = data.paths.flatMap((path) =>
    path.toShapes().map((shape) => {
      const { shape: outline } = shape.extractPoints(20)
      return new Shape(
        outline.map(
          (point) => new Vector2((point.x - MARK_WIDTH / 2) * MARK_SCALE, -(point.y - MARK_HEIGHT / 2) * MARK_SCALE),
        ),
      )
    }),
  )

  const geometry = new ExtrudeGeometry(shapes, {
    depth: 0.42,
    steps: 1,
    curveSegments: 1,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.035,
    bevelSegments: 8,
  })
  geometry.computeBoundingBox()
  const centre = new Vector3()
  geometry.boundingBox!.getCenter(centre)
  // Pivot each stroke around its own centre so it can tumble independently.
  geometry.translate(-centre.x, -centre.y, -centre.z)
  return { geometry, centre: new Vector3(centre.x, centre.y, 0) }
}

export class SymbolScene {
  readonly ready: Promise<void>

  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 100)
  private readonly mark = new Group()
  private readonly pivot = new Group()
  private readonly orbitGroup = new Group()
  private readonly rigs: PieceRig[] = []
  private readonly material: MeshPhysicalMaterial
  private readonly lineMaterial: LineBasicMaterial
  private readonly particleMaterial: PointsMaterial
  private readonly particles: Points
  private readonly satellite: Mesh
  private readonly emberLight = new PointLight(EMBER, 150, 0, 2)
  private readonly cobaltLight = new PointLight(COBALT, 70, 0, 2)
  private readonly voltLight = new PointLight(VOLT, 14, 0, 2)
  private readonly keyLight = new DirectionalLight(0xffffff, 1.3)
  private readonly envTexture: Texture

  private readonly targets = { hero: 0, page: 0, pointerX: 0, pointerY: 0, blast: 0 }
  private readonly state = { hero: 0, page: 0, pointerX: 0, pointerY: 0, blast: 0 }

  private width = 1
  private height = 1
  private elapsed = 0
  private lastTime = 0
  private running = false
  private wantsRunning = true
  private invalidated = false
  private disposed = false
  private reducedMotion: boolean
  private resolveReady!: () => void

  constructor({ canvas, dark, reducedMotion }: SymbolSceneOptions) {
    this.reducedMotion = reducedMotion
    this.ready = new Promise((resolve) => (this.resolveReady = resolve))

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping

    canvas.addEventListener('webglcontextlost', this.onContextLost)

    // Image-based lighting from a procedural studio — no HDR download required.
    const pmrem = new PMREMGenerator(this.renderer)
    const room = new RoomEnvironment()
    this.envTexture = pmrem.fromScene(room, 0.04).texture
    room.dispose()
    pmrem.dispose()
    this.scene.environment = this.envTexture

    this.camera.position.set(0, 0, 11)

    this.material = new MeshPhysicalMaterial({
      metalness: 0.86,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      iridescence: 0.22,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [160, 480],
    })

    markPieces.forEach((piece, index) => {
      const { geometry, centre } = createPieceGeometry(piece)
      const mesh = new Mesh(geometry, this.material)
      mesh.position.copy(centre)
      this.pivot.add(mesh)
      // Each stroke flies outward from the middle of the monogram, plus a little depth.
      const outward = new Vector2(centre.x, centre.y * 1.6).normalize()
      const scatter = new Vector3(outward.x * 0.9, outward.y * 0.9, SCATTER_DEPTH[index] ?? 0.6)
      this.rigs.push({ mesh, home: centre, scatter, spin: SPIN_AXES[index] ?? new Vector3(0, 1, 0) })
    })

    this.mark.add(this.pivot)
    this.scene.add(this.mark)

    this.keyLight.position.set(-4, 5, 6)
    this.voltLight.position.set(3.2, 3.4, -2.2)
    this.scene.add(this.keyLight, this.emberLight, this.cobaltLight, this.voltLight)

    // Orbit lines — thin ellipses that frame the mark like the reference's star charts.
    this.lineMaterial = new LineBasicMaterial({ transparent: true, depthWrite: false })
    for (const orbit of ORBITS) {
      const curve = new EllipseCurve(0, 0, orbit.rx, orbit.ry, 0, Math.PI * 2)
      const line = new LineLoop(new BufferGeometry().setFromPoints(curve.getPoints(256)), this.lineMaterial)
      const [rx, ry, rz] = orbit.rotation
      line.rotation.set(rx, ry, rz)
      this.orbitGroup.add(line)
    }

    this.satellite = new Mesh(new SphereGeometry(0.05, 16, 16), new MeshBasicMaterial({ color: EMBER }))
    this.orbitGroup.children[0]?.add(this.satellite)
    this.scene.add(this.orbitGroup)

    // Dust — a deterministic shell of points well behind and around the mark.
    const random = mulberry32(7)
    const count = 340
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const radius = 5 + random() * 9
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7
      positions[i * 3 + 2] = Math.min(radius * Math.cos(phi), 3) - 2
    }
    const particleGeometry = new BufferGeometry()
    particleGeometry.setAttribute('position', new BufferAttribute(positions, 3))
    this.particleMaterial = new PointsMaterial({
      size: 0.035,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
    this.particles = new Points(particleGeometry, this.particleMaterial)
    this.scene.add(this.particles)

    this.setTheme(dark)
    void this.warmUp()
  }

  // ───────────────────────── Public API ─────────────────────────

  setSize(width: number, height: number) {
    if (this.disposed || width === 0 || height === 0) return
    this.width = width
    this.height = height
    const compact = width < 768
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.5 : 2))
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.invalidate()
  }

  /** `hero`: 0→1 over the first viewport. `page`: 0→1 over the whole document. */
  setScroll(hero: number, page: number) {
    this.targets.hero = hero
    this.targets.page = page
    this.invalidate()
  }

  /** Pointer position in normalised device coordinates (-1…1). */
  setPointer(x: number, y: number) {
    this.targets.pointerX = x
    this.targets.pointerY = y
  }

  setBlast(active: boolean) {
    if (this.reducedMotion) return
    this.targets.blast = active ? 1 : 0
  }

  setTheme(dark: boolean) {
    const theme = THEMES[dark ? 'dark' : 'light']
    this.material.color.setHex(theme.body)
    this.lineMaterial.color.setHex(theme.lines)
    this.lineMaterial.opacity = theme.lineOpacity
    this.particleMaterial.color.setHex(theme.particles)
    this.renderer.toneMappingExposure = theme.exposure
    this.scene.environmentIntensity = theme.env
    this.invalidate()
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced
    if (reduced) this.targets.blast = 0
    this.updateLoop()
  }

  /** Pauses rendering entirely (tab hidden, canvas faded out). */
  setActive(active: boolean) {
    this.wantsRunning = active
    this.updateLoop()
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost)
    this.scene.traverse((object) => {
      if (object instanceof Mesh || object instanceof LineLoop || object instanceof Points) {
        object.geometry.dispose()
      }
    })
    this.material.dispose()
    this.lineMaterial.dispose()
    this.particleMaterial.dispose()
    ;(this.satellite.material as MeshBasicMaterial).dispose()
    this.envTexture.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }

  // ───────────────────────── Internals ─────────────────────────

  private async warmUp() {
    // Compile shaders off the critical path where the driver supports it; otherwise the
    // first render compiles synchronously (and three would warn about the missing extension).
    if (this.renderer.extensions.has('KHR_parallel_shader_compile')) {
      try {
        await this.renderer.compileAsync(this.scene, this.camera)
      } catch {
        // Fall through to a synchronous compile on first render.
      }
    }
    if (this.disposed) return
    this.step(0)
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

  /** Reduced motion renders on demand only — one frame per input change. */
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

  private layout() {
    const aspect = this.width / this.height
    if (aspect < 0.8) return { x: 0, y: -1.25, scale: 0.55, drift: 0.3 }
    if (aspect < 1.25) return { x: 0.75, y: -0.5, scale: 0.75, drift: 0.55 }
    return { x: 1.55, y: -0.1, scale: 1, drift: 0.85 }
  }

  private step(dt: number, snap = false) {
    const { state, targets } = this
    const ease = (current: number, target: number, lambda: number) =>
      snap ? target : MathUtils.damp(current, target, lambda, dt)

    state.hero = ease(state.hero, targets.hero, 5.5)
    state.page = ease(state.page, targets.page, 5.5)
    state.pointerX = ease(state.pointerX, targets.pointerX, 3)
    state.pointerY = ease(state.pointerY, targets.pointerY, 3)
    state.blast = ease(state.blast, targets.blast, targets.blast > state.blast ? 3.2 : 2.2)

    if (!this.reducedMotion) this.elapsed += dt
    const t = this.elapsed
    const layout = this.layout()

    this.mark.position.set(
      layout.x + Math.sin(state.page * Math.PI) * layout.drift,
      layout.y + state.hero * 0.35 + Math.sin(t * 0.6) * 0.06,
      -state.hero * 1.6 - state.page * 1.4,
    )
    this.mark.rotation.set(
      0.16 + state.hero * 0.45 + Math.sin(t * 0.35) * 0.05,
      -0.45 + state.hero * 1.2 + state.page * Math.PI * 1.6 + Math.sin(t * 0.25) * 0.12,
      Math.sin(t * 0.3) * 0.06,
    )
    this.mark.scale.setScalar(layout.scale)

    this.pivot.rotation.x = state.pointerY * 0.22
    this.pivot.rotation.y = state.pointerX * 0.32

    // Scroll opens the strokes slightly; press-and-hold throws them apart (kept mostly in frame).
    const scatter = smoothstep(0.02, 0.75, state.hero) * 0.5 + state.blast * 1.15
    this.rigs.forEach((rig, index) => {
      const wobble = state.blast * Math.sin(t * 2.2 + index * 2.1) * 0.18
      rig.mesh.position.copy(rig.home).addScaledVector(rig.scatter, scatter)
      rig.mesh.rotation.set(
        rig.spin.x * scatter * 0.9 + wobble,
        rig.spin.y * scatter * 0.9,
        rig.spin.z * scatter * 0.9 - wobble,
      )
    })

    // Coloured lights orbit the mark so hot highlights travel across the bevels.
    const a = t * 0.55
    // The ember light sweeps close across the front faces — the warm streak from the reference.
    this.emberLight.position.set(Math.cos(a) * 2.6, Math.sin(a * 0.8) * 1.8 + 0.4, 1.9 + Math.sin(a) * 0.6)
    this.cobaltLight.position.set(-Math.cos(a * 0.7) * 3.8, -1.6 + Math.sin(a * 0.5), -1.2)

    this.orbitGroup.rotation.y = t * 0.02 + state.page * 0.6
    this.orbitGroup.rotation.x = state.hero * 0.12
    this.particles.rotation.y = t * 0.012 + state.page * 0.4

    const orbit = ORBITS[0]
    const u = t * 0.18
    this.satellite.position.set(Math.cos(u) * orbit.rx, Math.sin(u) * orbit.ry, 0)
  }
}

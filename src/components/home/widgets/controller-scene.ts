import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  type Texture,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

/*
 * An Xbox Elite Series 2 controller, modelled in code from the front-on product shot.
 *
 * The shell is a deeply bevelled extrusion of the silhouette — long handles that flare as they
 * drop, a shallow arch between them — wrapped in stippled rubber, with a separate smooth
 * faceplate laid over the top of the face. On it: metal-topped sticks with knurled rims, the
 * faceted steel D-pad and its dial ticks, glossy black face buttons with dark letters, the lit
 * Xbox button, View / Menu, the profile button and its three lights.
 *
 * Left alone it floats and "plays itself" (sticks drift, buttons get pressed, profiles cycle).
 * It rumbles on demand, and swaps between the black finish and the white-shelled Core —
 * the shell, faceplate and bumpers blend across while the grips, sticks and buttons stay black.
 */

/** The two finishes: the black Elite Series 2, and the Core with its white shell. */
export type ControllerVariant = 'black' | 'white'

export interface ControllerSceneOptions {
  canvas: HTMLCanvasElement
  reducedMotion: boolean
}

type Point = readonly [number, number]
type Segment = readonly [c1: Point, c2: Point, end: Point]

/**
 * Right half of the silhouette, face-on (y up, ~2 units across the handles), top centre
 * clockwise to bottom centre. Every join is tangent-continuous, so the outline has no corners.
 */
const START: Point = [0, 0.665]
const TOP: Segment = [[0.22, 0.672], [0.46, 0.648], [0.6, 0.6]]
const BOTTOM: Segment = [[0.24, -0.165], [0.1, -0.17], [0, -0.17]]
const OUTLINE: Segment[] = [
  TOP,
  [[0.71, 0.565], [0.785, 0.46], [0.8, 0.33]],
  [[0.82, 0.18], [0.875, 0], [0.885, -0.17]],
  [[0.895, -0.32], [0.885, -0.45], [0.84, -0.53]],
  [[0.8, -0.605], [0.72, -0.625], [0.68, -0.6]],
  [[0.62, -0.555], [0.6, -0.38], [0.55, -0.32]],
  [[0.5, -0.26], [0.45, -0.2], [0.36, -0.18]],
  BOTTOM,
]

/** Height on the outer edge where the rubber grip begins — high on the shoulder. */
const GRIP_TOP = 0.5

/**
 * The smooth faceplate — a broad shield: the outline over the top to the shoulder, then a
 * long diagonal down past the sticks to where the handle meets the bottom edge.
 */
const FACEPLATE: Segment[] = [
  TOP,
  [[0.67, 0.575], [0.72, 0.535], [0.745, GRIP_TOP]],
  [[0.7, 0.36], [0.5, 0], [0.36, -0.18]],
  BOTTOM,
]

const DEPTH = 0.2
const BEVEL_THICKNESS = 0.2
const BEVEL_SIZE = 0.11
/** z of the flat front face, once the shell is centred on z = 0. */
const FACE = DEPTH / 2 + BEVEL_THICKNESS

/** Where things sit on the face (measured off the product shot). */
const LAYOUT = {
  leftStick: [-0.53, 0.37],
  rightStick: [0.29, 0.05],
  dpad: [-0.265, 0.02],
  faceButtons: [0.535, 0.36],
  guide: [0, 0.56],
  view: [-0.15, 0.35],
  menu: [0.15, 0.35],
  pairing: [0, 0.355],
  profile: [0, 0.24],
  profileLights: [0, 0.0125],
} as const satisfies Record<string, Point>

/** Face buttons, clockwise from the top. */
const FACE_BUTTONS = [
  { letter: 'Y', x: 0, y: 1 },
  { letter: 'B', x: 1, y: 0 },
  { letter: 'A', x: 0, y: -1 },
  { letter: 'X', x: -1, y: 0 },
] as const
const BUTTON_SPREAD = 0.1325
const BUTTON_RADIUS = 0.064

/** The faceted D-pad rocks in eight directions. */
const DPAD_DIRECTIONS = [
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
] as const

const PRESS_TIME = 0.18
const PROFILE_TIME = 2.6
const RUMBLE_TIME = 0.55

/** Colours that change with the finish: [black, white]. */
const FINISH = {
  shell: [0x131313, 0xe7e7e3],
  faceplate: [0x0e0e0e, 0xefefeb],
  trim: [0x0c0c0c, 0xe4e4e0],
  dpad: [0xc9ccd2, 0x37393d],
  tick: [0x9a9a9a, 0x5e5e5e],
  light: [0x262626, 0x8f8f8f],
} as const satisfies Record<string, readonly [number, number]>

interface Swatch {
  material: { color: Color }
  black: Color
  white: Color
}

interface Press {
  /** Seconds left in the current press (0 = at rest). */
  time: number
}

interface FaceButton extends Press {
  mesh: Group
  letter: MeshStandardMaterial
}

/** A closed shape from its right half (top centre → bottom centre); the left half is mirrored. */
function mirrored(rightHalf: readonly Segment[]): Shape {
  const shape = new Shape()
  shape.moveTo(...START)
  for (const [c1, c2, end] of rightHalf) shape.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], end[0], end[1])
  // Walk the right half backwards with x mirrored.
  const ends = [START, ...rightHalf.map(([, , end]) => end)]
  for (let i = rightHalf.length - 1; i >= 0; i--) {
    const [c1, c2] = rightHalf[i]!
    const end = ends[i]!
    shape.bezierCurveTo(-c2[0], c2[1], -c1[0], c1[1], -end[0], end[1])
  }
  return shape
}

/**
 * The shell, welded so the bevel shades as one moulded surface, then split into two material
 * groups — 0: smooth plastic (the upper sides and shoulders), 1: stippled rubber (the handles,
 * the back, and the front face, whose upper part the faceplate covers) — with UVs projected
 * along each vertex's dominant axis so the stipple wraps the sides without stretching.
 */
function shellGeometry(): BufferGeometry {
  const extruded = new ExtrudeGeometry(mirrored(OUTLINE), {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL_THICKNESS,
    bevelSize: BEVEL_SIZE,
    bevelSegments: 12,
    curveSegments: 40,
  })
  extruded.translate(0, 0, -DEPTH / 2)
  extruded.deleteAttribute('uv')
  const shell = mergeVertices(extruded, 1e-4)
  extruded.dispose()
  shell.computeVertexNormals()

  const position = shell.getAttribute('position')
  const normal = shell.getAttribute('normal')
  const uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    const [x, y, z] = [position.getX(i), position.getY(i), position.getZ(i)]
    const [nx, ny, nz] = [Math.abs(normal.getX(i)), Math.abs(normal.getY(i)), Math.abs(normal.getZ(i))]
    const [u, v] = nz >= nx && nz >= ny ? [x, y] : nx >= ny ? [z, y] : [x, z]
    uv[i * 2] = u * 24
    uv[i * 2 + 1] = v * 24
  }
  shell.setAttribute('uv', new BufferAttribute(uv, 2))

  const index = shell.getIndex()!
  const plastic: number[] = []
  const rubber: number[] = []
  const [a, b, c] = [new Vector3(), new Vector3(), new Vector3()]
  const ab = new Vector3()
  const facing = new Vector3()
  for (let i = 0; i < index.count; i += 3) {
    const corners = [index.getX(i), index.getX(i + 1), index.getX(i + 2)] as const
    a.fromBufferAttribute(position, corners[0])
    b.fromBufferAttribute(position, corners[1])
    c.fromBufferAttribute(position, corners[2])
    facing.subVectors(c, b).cross(ab.subVectors(a, b)).normalize()
    const frontCap = facing.z > 0.999
    const isRubber = frontCap || facing.z < -0.3 || (a.y + b.y + c.y) / 3 < GRIP_TOP
    ;(isRubber ? rubber : plastic).push(...corners)
  }
  shell.setIndex([...plastic, ...rubber])
  shell.addGroup(0, plastic.length, 0)
  shell.addGroup(plastic.length, rubber.length, 1)
  return shell
}

/** A cylinder standing out of the face (three's cylinders run along y). */
function faceCylinder(radiusTop: number, radiusBottom: number, height: number, segments = 40) {
  return new CylinderGeometry(radiusTop, radiusBottom, height, segments).rotateX(Math.PI / 2)
}

/** A lathe whose axis points out of the face. Profiles run rim → centre so faces point outwards. */
function faceLathe(profile: readonly Point[], segments: number, phiStart = 0) {
  return new LatheGeometry(
    profile.map(([r, h]) => new Vector2(r, h)),
    segments,
    phiStart,
  ).rotateX(Math.PI / 2)
}

/** Clips a convex polygon to an axis-aligned box (Sutherland–Hodgman); ±Infinity leaves a side open. */
function clipToBox(polygon: Point[], x0: number, x1: number, y0: number, y1: number): Point[] {
  const atX = (a: Point, b: Point, x: number): Point => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])]
  const atY = (a: Point, b: Point, y: number): Point => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y]
  const planes: [inside: (p: Point) => boolean, cut: (a: Point, b: Point) => Point][] = [
    [(p) => p[0] >= x0, (a, b) => atX(a, b, x0)],
    [(p) => p[0] <= x1, (a, b) => atX(a, b, x1)],
    [(p) => p[1] >= y0, (a, b) => atY(a, b, y0)],
    [(p) => p[1] <= y1, (a, b) => atY(a, b, y1)],
  ]
  let output = polygon
  for (const [inside, cut] of planes) {
    const input = output
    output = []
    input.forEach((current, i) => {
      const previous = input[(i + input.length - 1) % input.length]!
      if (inside(current)) {
        if (!inside(previous)) output.push(cut(previous, current))
        output.push(current)
      } else if (inside(previous)) {
        output.push(cut(previous, current))
      }
    })
  }
  return output
}

/**
 * The Elite's D-pad: a disc whose top is cut into a 3 × 3 grid of flat facets — a flat centre,
 * four edge facets tilted one way, four corners tilted two ways — rising towards the rim.
 */
function facetedDish(radius: number): BufferGeometry {
  const inner = radius * 0.34
  const base = radius * 0.1
  const slope = (radius * 0.3) / (radius - inner)
  const height = (x: number, y: number) =>
    base + slope * (Math.max(0, Math.abs(x) - inner) + Math.max(0, Math.abs(y) - inner))
  const circle = Array.from({ length: 96 }, (_, i): Point => {
    const angle = (i / 96) * Math.PI * 2
    return [Math.cos(angle) * radius, Math.sin(angle) * radius]
  })

  const positions: number[] = []
  const vertex = ([x, y]: Point, z = height(x, y)) => positions.push(x, y, z)
  const cuts = [-Infinity, -inner, inner, Infinity]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const cell = clipToBox(circle, cuts[i]!, cuts[i + 1]!, cuts[j]!, cuts[j + 1]!)
      if (cell.length < 3) continue
      const centre: Point = [
        cell.reduce((sum, [x]) => sum + x, 0) / cell.length,
        cell.reduce((sum, [, y]) => sum + y, 0) / cell.length,
      ]
      cell.forEach((point, k) => {
        vertex(centre)
        vertex(point)
        vertex(cell[(k + 1) % cell.length]!)
      })
    }
  }
  // The rim wall, down to the face.
  circle.forEach((point, k) => {
    const next = circle[(k + 1) % circle.length]!
    vertex(point, 0)
    vertex(next, 0)
    vertex(next)
    vertex(point, 0)
    vertex(next)
    vertex(point)
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.computeVertexNormals()
  return geometry
}

function canvasTexture(size: number, draw: (context: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  draw(canvas.getContext('2d')!, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** A staggered dot grid, used as a bump map: the stippled rubber on the grips and stick rims. */
function stippleTexture() {
  const texture = canvasTexture(64, (context, size) => {
    context.fillStyle = '#000'
    context.fillRect(0, 0, size, size)
    for (const [x, y] of [
      [0, 0],
      [size, 0],
      [0, size],
      [size, size],
      [size / 2, size / 2],
    ] as const) {
      const dot = context.createRadialGradient(x, y, 0, x, y, size * 0.22)
      dot.addColorStop(0, '#fff')
      dot.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = dot
      context.fillRect(x - size / 2, y - size / 2, size, size)
    }
  })
  texture.colorSpace = NoColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  return texture
}

function letterTexture(letter: string) {
  return canvasTexture(128, (context, size) => {
    context.fillStyle = '#fff'
    context.font = `700 ${size * 0.5}px system-ui, sans-serif`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(letter, size / 2, size / 2 + size * 0.04)
  })
}

/** The Xbox button: a white sphere crossed by a dark X. */
function guideTexture() {
  return canvasTexture(128, (context, size) => {
    const c = size / 2
    context.fillStyle = '#f2f2f2'
    context.beginPath()
    context.arc(c, c, size * 0.47, 0, Math.PI * 2)
    context.fill()
    context.strokeStyle = '#151515'
    context.lineWidth = size * 0.13
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(size * 0.27, size * 0.24)
    context.quadraticCurveTo(c * 1.18, c * 0.92, size * 0.74, size * 0.77)
    context.moveTo(size * 0.73, size * 0.24)
    context.quadraticCurveTo(c * 0.82, c * 0.92, size * 0.26, size * 0.77)
    context.stroke()
  })
}

/** View (two overlapping windows) and Menu (three lines) glyphs. */
function iconTexture(kind: 'view' | 'menu') {
  return canvasTexture(64, (context, size) => {
    context.strokeStyle = '#fff'
    context.lineWidth = size * 0.07
    context.lineCap = 'round'
    if (kind === 'menu') {
      for (const y of [0.36, 0.5, 0.64]) {
        context.beginPath()
        context.moveTo(size * 0.32, size * y)
        context.lineTo(size * 0.68, size * y)
        context.stroke()
      }
    } else {
      context.strokeRect(size * 0.3, size * 0.3, size * 0.26, size * 0.24)
      context.strokeRect(size * 0.42, size * 0.44, size * 0.26, size * 0.24)
    }
  })
}

export class ControllerScene {
  readonly ready: Promise<void>

  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(28, 1, 0.1, 50)
  private readonly pad = new Group()
  private readonly envTexture: Texture
  private readonly textures: Texture[] = []

  private readonly leftStick = new Group()
  private readonly rightStick = new Group()
  private readonly dpad = new Group()
  private readonly faceButtons: FaceButton[] = []
  private readonly dpadPress: Press & { direction: readonly [number, number] } = { time: 0, direction: [0, 1] }
  private readonly guideGlow: MeshStandardMaterial
  private readonly profileLights: MeshStandardMaterial[] = []
  private readonly swatches: Swatch[] = []
  private variant: ControllerVariant = 'black'
  /** 0 = black, 1 = white; eases toward the chosen finish. */
  private finish = 0

  private readonly pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
  private elapsed = 0
  private nextPress = 0.6
  private rumbleTime = 0
  private lastTime = 0
  private running = false
  private wantsRunning = false
  private reducedMotion: boolean
  private disposed = false
  private resolveReady!: () => void

  constructor({ canvas, reducedMotion }: ControllerSceneOptions) {
    this.reducedMotion = reducedMotion
    this.ready = new Promise((resolve) => (this.resolveReady = resolve))

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    canvas.addEventListener('webglcontextlost', this.onContextLost)

    const pmrem = new PMREMGenerator(this.renderer)
    const room = new RoomEnvironment()
    this.envTexture = pmrem.fromScene(room, 0.04).texture
    room.dispose()
    pmrem.dispose()
    this.scene.environment = this.envTexture
    this.scene.environmentIntensity = 0.85

    // ── Materials ──
    const stipple = this.track(stippleTexture())
    const knurl = this.track(stipple.clone())
    knurl.repeat.set(24, 2)
    // Materials that set their own reflection strength take the environment map directly —
    // envMapIntensity is ignored for maps that come from scene.environment.
    const env = { envMap: this.envTexture }
    const plastic = this.paint(
      new MeshPhysicalMaterial({ ...env, roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.45, envMapIntensity: 0.6 }),
      FINISH.shell,
    )
    // The faceplate is flat, so it catches the studio's ceiling: keep its reflections low.
    const faceplate = this.paint(
      new MeshPhysicalMaterial({ ...env, roughness: 0.55, clearcoat: 0.12, clearcoatRoughness: 0.45, envMapIntensity: 0.22 }),
      FINISH.faceplate,
    )
    const rubber = new MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.9, bumpMap: stipple, bumpScale: 1.5 })
    const knurled = new MeshStandardMaterial({ color: 0x101010, roughness: 0.85, bumpMap: knurl, bumpScale: 1.3 })
    const gloss = new MeshPhysicalMaterial({ color: 0x0c0c0c, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 })
    // Bumpers and triggers follow the shell; the face buttons stay black on both finishes.
    const trim = this.paint(gloss.clone(), FINISH.trim)
    const recess = new MeshStandardMaterial({ color: 0x060606, roughness: 0.9 })
    const chrome = new MeshStandardMaterial({ color: 0xc4c8ce, metalness: 1, roughness: 0.14 })
    const brushed = new MeshStandardMaterial({ ...env, color: 0x6f7378, metalness: 1, roughness: 0.45, envMapIntensity: 0.5 })
    const faceted = this.paint(new MeshStandardMaterial({ metalness: 1, roughness: 0.12, flatShading: true }), FINISH.dpad)
    const tick = this.paint(new MeshStandardMaterial({ roughness: 0.6 }), FINISH.tick)
    const icon = (texture: Texture) =>
      new MeshStandardMaterial({ map: this.track(texture), transparent: true, color: 0xbdbdbd, roughness: 0.4 })

    // ── Shell, faceplate, bumpers ──
    this.pad.add(new Mesh(shellGeometry(), [plastic, rubber]))
    const plate = new Mesh(new ShapeGeometry(mirrored(FACEPLATE), 48), faceplate)
    // Lifted just clear of the shell's front face; everything on the face sits above it.
    plate.position.z = FACE + 0.002
    this.pad.add(plate)
    for (const side of [-1, 1]) {
      const bumper = new Mesh(new RoundedBoxGeometry(0.46, 0.1, 0.26, 3, 0.045), trim)
      bumper.position.set(side * 0.5, 0.75, -0.04)
      bumper.rotation.z = side * -0.22
      const trigger = new Mesh(new RoundedBoxGeometry(0.28, 0.2, 0.2, 3, 0.07), trim)
      trigger.position.set(side * 0.5, 0.72, -0.27)
      trigger.rotation.set(-0.5, 0, side * -0.12)
      this.pad.add(bumper, trigger)
    }

    // ── Thumbsticks: glossy well; steel shaft; knurled rubber rim round a concave metal top ──
    const buildStick = (stick: Group, [x, y]: Point) => {
      const well = new Mesh(new TorusGeometry(0.155, 0.022, 12, 56), gloss)
      well.position.set(x, y, FACE)
      const floor = new Mesh(faceCylinder(0.15, 0.15, 0.01), recess)
      floor.position.set(x, y, FACE - 0.001)
      const shaft = new Mesh(faceCylinder(0.042, 0.05, 0.12, 32), chrome)
      shaft.position.z = 0.06
      const base = new Mesh(faceCylinder(0.118, 0.1, 0.045, 48), knurled)
      base.position.z = 0.125
      const rim = new Mesh(new TorusGeometry(0.108, 0.023, 12, 56), knurled)
      rim.position.z = 0.15
      const top = new Mesh(
        faceLathe(
          [
            [0.092, 0.009],
            [0.065, 0.004],
            [0, 0.001],
          ],
          48,
        ),
        brushed,
      )
      top.position.z = 0.15
      stick.add(shaft, base, rim, top)
      stick.position.set(x, y, FACE)
      this.pad.add(well, floor, stick)
    }
    buildStick(this.leftStick, LAYOUT.leftStick)
    buildStick(this.rightStick, LAYOUT.rightStick)

    // ── Face buttons: glossy domes; the letters sit on a second, UV-projected copy of the dome ──
    const dome = new LatheGeometry(
      Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 11) * (Math.PI / 2)
        return new Vector2(Math.cos(angle) * BUTTON_RADIUS, Math.sin(angle) * BUTTON_RADIUS * 0.42)
      }),
      40,
    ).rotateX(Math.PI / 2)
    const letterDome = dome.clone()
    const domePosition = letterDome.getAttribute('position')
    const domeUv = letterDome.getAttribute('uv')
    for (let i = 0; i < domePosition.count; i++) {
      domeUv.setXY(i, domePosition.getX(i) / (2 * BUTTON_RADIUS) + 0.5, domePosition.getY(i) / (2 * BUTTON_RADIUS) + 0.5)
    }
    const [bx, by] = LAYOUT.faceButtons
    for (const { letter, x, y } of FACE_BUTTONS) {
      const button = new Group()
      const skirt = new Mesh(faceCylinder(BUTTON_RADIUS, BUTTON_RADIUS * 1.04, 0.035, 40), gloss)
      skirt.position.z = 0.0175
      const cap = new Mesh(dome, gloss)
      cap.position.z = 0.035
      const glyph = this.track(letterTexture(letter))
      const letterMaterial = new MeshStandardMaterial({
        map: glyph,
        emissiveMap: glyph,
        transparent: true,
        color: 0x5a5a5a,
        emissive: 0xffffff,
        emissiveIntensity: 0,
        roughness: 0.6,
        ...env,
        envMapIntensity: 0.4,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
      const decal = new Mesh(letterDome, letterMaterial)
      decal.position.z = 0.035
      button.add(skirt, cap, decal)
      button.position.set(bx + x * BUTTON_SPREAD, by + y * BUTTON_SPREAD, FACE)
      this.pad.add(button)
      this.faceButtons.push({ mesh: button, letter: letterMaterial, time: 0 })
    }

    // ── D-pad: the faceted steel dish in a well, with dial ticks round all but the light side ──
    const [dx, dy] = LAYOUT.dpad
    const dpadWell = new Mesh(faceCylinder(0.16, 0.16, 0.01), recess)
    dpadWell.position.set(dx, dy, FACE - 0.001)
    this.dpad.add(new Mesh(facetedDish(0.148), faceted))
    this.dpad.position.set(dx, dy, FACE)
    this.pad.add(dpadWell, this.dpad)
    const tickGeometry = new PlaneGeometry(0.026, 0.0045)
    for (let degrees = 45; degrees <= 315; degrees += 22.5) {
      const angle = MathUtils.degToRad(degrees)
      const mark = new Mesh(tickGeometry, tick)
      mark.position.set(dx + Math.cos(angle) * 0.188, dy + Math.sin(angle) * 0.188, FACE + 0.005)
      mark.rotation.z = angle
      this.pad.add(mark)
    }

    // ── Xbox button, View / Menu, profile button and its three lights ──
    const guideMap = this.track(guideTexture())
    this.guideGlow = new MeshStandardMaterial({
      map: guideMap,
      emissiveMap: guideMap,
      emissive: 0xffffff,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    })
    const [gx, gy] = LAYOUT.guide
    const guideBase = new Mesh(faceCylinder(0.07, 0.074, 0.026), gloss)
    guideBase.position.set(gx, gy, FACE + 0.013)
    const guideFace = new Mesh(new CircleGeometry(0.06, 40), this.guideGlow)
    guideFace.position.set(gx, gy, FACE + 0.027)
    this.pad.add(guideBase, guideFace)

    for (const [kind, [x, y]] of [
      ['view', LAYOUT.view],
      ['menu', LAYOUT.menu],
    ] as const) {
      const small = new Mesh(faceCylinder(0.034, 0.036, 0.026, 32), gloss)
      small.position.set(x, y, FACE + 0.013)
      const glyph = new Mesh(new CircleGeometry(0.029, 24), icon(iconTexture(kind)))
      glyph.position.set(x, y, FACE + 0.027)
      this.pad.add(small, glyph)
    }

    const [ax, ay] = LAYOUT.pairing
    const pairing = new Mesh(new CircleGeometry(0.008, 16), recess)
    pairing.position.set(ax, ay, FACE + 0.005)
    this.pad.add(pairing)

    const [px, py] = LAYOUT.profile
    const profile = new Mesh(new RoundedBoxGeometry(0.095, 0.04, 0.026, 2, 0.016), gloss)
    profile.position.set(px, py, FACE + 0.011)
    this.pad.add(profile)

    const [lx, ly] = LAYOUT.profileLights
    const lightGeometry = new PlaneGeometry(0.04, 0.01)
    for (const offset of [0.035, 0, -0.035]) {
      const light = this.paint(
        new MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 0, toneMapped: false }),
        FINISH.light,
      )
      const bar = new Mesh(lightGeometry, light)
      bar.position.set(lx, ly + offset, FACE + 0.005)
      this.pad.add(bar)
      this.profileLights.push(light)
    }

    this.scene.add(this.pad)

    // Key from the top left, a strong rim from behind for the silhouette, a volt bounce below.
    const key = new DirectionalLight(0xffffff, 1.7)
    key.position.set(-2, 3, 4)
    const rim = new DirectionalLight(0xffffff, 2.6)
    rim.position.set(0.5, 2.5, -4)
    const bounce = new DirectionalLight(0xe6f052, 0.7)
    bounce.position.set(0, -3, 2)
    this.scene.add(key, rim, bounce)

    this.camera.position.set(0, 0, 6)
    void this.warmUp()
  }

  // ───────────────────────── Public API ─────────────────────────

  setSize(width: number, height: number) {
    if (this.disposed || width === 0 || height === 0) return
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(width, height, false)
    const aspect = width / height
    this.camera.aspect = aspect
    // Keep the whole pad in frame, even mid-swing: ~2.6 units across, ~2.05 units tall.
    const span = Math.max(2.05, 2.6 / aspect)
    this.camera.position.z = span / (2 * Math.tan(MathUtils.degToRad(this.camera.fov) / 2))
    this.camera.updateProjectionMatrix()
    this.renderStill()
  }

  /** Pointer over the tile, normalised to -1…1. */
  setPointer(x: number, y: number) {
    this.pointer.targetX = x
    this.pointer.targetY = y
  }

  /** A short buzz — and a button mash to go with it. */
  rumble() {
    if (this.reducedMotion) return
    this.rumbleTime = RUMBLE_TIME
    for (const button of this.faceButtons) button.time = PRESS_TIME * (0.6 + Math.random() * 0.8)
  }

  /** Swaps black ⇄ white (the colours blend across) and returns the new finish. */
  toggleVariant(): ControllerVariant {
    this.variant = this.variant === 'black' ? 'white' : 'black'
    if (this.reducedMotion) {
      this.finish = this.variant === 'white' ? 1 : 0
      this.applyFinish()
      this.renderStill()
    }
    return this.variant
  }

  setActive(active: boolean) {
    this.wantsRunning = active
    this.updateLoop()
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced
    this.updateLoop()
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost)
    const geometries = new Set<{ dispose(): void }>()
    const materials = new Set<{ dispose(): void }>()
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      geometries.add(object.geometry)
      for (const material of [object.material].flat()) materials.add(material)
    })
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((material) => material.dispose())
    this.textures.forEach((texture) => texture.dispose())
    this.envTexture.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }

  // ───────────────────────── Internals ─────────────────────────

  /** Registers a material whose colour follows the finish, and sets it to the current one. */
  private paint<T extends { color: Color }>(material: T, [black, white]: readonly [number, number]): T {
    const swatch = { material, black: new Color(black), white: new Color(white) }
    this.swatches.push(swatch)
    material.color.copy(swatch.black)
    return material
  }

  private applyFinish() {
    for (const { material, black, white } of this.swatches) material.color.lerpColors(black, white, this.finish)
  }

  private track<T extends Texture>(texture: T): T {
    this.textures.push(texture)
    return texture
  }

  private async warmUp() {
    if (this.renderer.extensions.has('KHR_parallel_shader_compile')) {
      try {
        await this.renderer.compileAsync(this.scene, this.camera)
      } catch {
        // Compiles synchronously on the first render instead.
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
    if (!shouldRun) this.renderStill()
  }

  /** One frame at the resting pose — for reduced motion and resizes while paused. */
  private renderStill() {
    if (this.running || this.disposed) return
    this.step(0)
    this.renderer.render(this.scene, this.camera)
  }

  private readonly onFrame = (time: number) => {
    // A frame's timestamp can predate the performance.now() taken when the loop started, so
    // the first step can come out negative — clamp it, or the clock starts below zero.
    const dt = MathUtils.clamp((time - this.lastTime) / 1000, 0, 1 / 20)
    this.lastTime = time
    this.step(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private step(dt: number) {
    this.elapsed += dt
    const t = this.elapsed
    const { pointer } = this
    pointer.x = MathUtils.damp(pointer.x, pointer.targetX, 4, dt)
    pointer.y = MathUtils.damp(pointer.y, pointer.targetY, 4, dt)

    // Near face-on like the product shot, floating, leaning toward the pointer.
    this.pad.rotation.set(
      -0.32 + Math.sin(t * 0.7) * 0.05 + pointer.y * 0.28,
      0.1 + Math.sin(t * 0.45) * 0.22 + pointer.x * 0.4,
      -0.03 + Math.sin(t * 0.38) * 0.035,
    )
    this.pad.position.set(0, -0.04 + Math.sin(t * 1.1) * 0.045, 0)

    // Rumble: a decaying high-frequency shake.
    if (this.rumbleTime > 0) {
      this.rumbleTime = Math.max(0, this.rumbleTime - dt)
      const strength = this.rumbleTime / RUMBLE_TIME
      this.pad.position.x += Math.sin(t * 95) * 0.03 * strength
      this.pad.position.y += Math.cos(t * 83) * 0.02 * strength
      this.pad.rotation.z += Math.sin(t * 71) * 0.035 * strength
    }

    // Sticks wander like someone's mid-match.
    this.leftStick.rotation.set(Math.sin(t * 1.3) * 0.25, Math.cos(t * 0.9) * 0.25, 0)
    this.rightStick.rotation.set(Math.sin(t * 0.8 + 1) * 0.2, Math.sin(t * 1.7) * 0.27, 0)

    // Every so often, press something.
    if (dt > 0 && t >= this.nextPress) {
      this.nextPress = t + 0.35 + Math.random() * 0.9
      if (Math.random() < 0.7) {
        const button = this.faceButtons[Math.floor(Math.random() * this.faceButtons.length)]
        if (button) button.time = PRESS_TIME
      } else {
        this.dpadPress.time = PRESS_TIME
        this.dpadPress.direction = DPAD_DIRECTIONS[Math.floor(Math.random() * DPAD_DIRECTIONS.length)] ?? [0, 1]
      }
    }

    for (const button of this.faceButtons) {
      button.time = Math.max(0, button.time - dt)
      const pressed = Math.sin((button.time / PRESS_TIME) * Math.PI)
      button.mesh.position.z = FACE - pressed * 0.018
      button.letter.emissiveIntensity = pressed * 1.6
    }

    // The pressed side of the D-pad dips into the face.
    this.dpadPress.time = Math.max(0, this.dpadPress.time - dt)
    const rock = Math.sin((this.dpadPress.time / PRESS_TIME) * Math.PI) * 0.16
    const [rx, ry] = this.dpadPress.direction
    this.dpad.rotation.set(-ry * rock, rx * rock, 0)

    // The profile lights step through the three slots; the Xbox button breathes.
    const profile = Math.floor(t / PROFILE_TIME) % this.profileLights.length
    this.profileLights.forEach((light, index) => (light.emissiveIntensity = index === profile ? 1 : 0))
    this.guideGlow.emissiveIntensity = 0.55 + Math.sin(t * 2.2) * 0.2

    // Blend toward the chosen finish.
    const target = this.variant === 'white' ? 1 : 0
    if (this.finish !== target) {
      this.finish = Math.abs(target - this.finish) < 0.002 ? target : MathUtils.damp(this.finish, target, 7, dt)
      this.applyFinish()
    }
  }
}

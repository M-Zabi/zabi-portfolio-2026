/**
 * The MZ monogram — the owner's brand mark — defined once, in SVG user units (y-down).
 *
 * The source logo is a single path; it is split here into its six strokes so that the SVG
 * logo, the favicon and the extruded WebGL symbol all come from the same geometry, and
 * each stroke can move on its own (hover "explode", the 404 scatter, the 3D scroll split).
 */

export interface MarkPiece {
  id: string
  /** Absolute SVG path data for this stroke. */
  d: string
  /** Direction (SVG units) the stroke drifts when the mark comes apart. */
  drift: readonly [x: number, y: number]
}

export const MARK_WIDTH = 174.22
export const MARK_HEIGHT = 89.24
export const markViewBox = `0 0 ${MARK_WIDTH} ${MARK_HEIGHT}`

export const markPieces: readonly MarkPiece[] = [
  { id: 'm-foot', d: 'M10.73 66.55S10.4 83.88 0 89.24h20.56s-8.83-6.81-9.83-22.69z', drift: [-4, 4] },
  { id: 'm-diagonal', d: 'M30.42 0H6.6l2.46 1.57 29.18 87.67h11.29l11.64-32.76-8.27 11.41z', drift: [-3, -4] },
  { id: 'm-stem', d: 'M95.17 89.24H71.23l1.9-1.33v-67.1L80.18 0h14.87l-1.8 1.24v86.67z', drift: [-1, 4] },
  { id: 'z-top', d: 'M137.53 0c-13.07 1.92-24.82 13-28.94 29V0z', drift: [-1, -5] },
  { id: 'z-diagonal', d: 'M151.63 0l-45.29 89.13 22.48 0.11L174.22 0z', drift: [3, -1] },
  { id: 'z-bottom', d: 'M173.1 58.16v31.08h-28.62c19.91-2.46 27.73-25.38 28.62-31.08z', drift: [5, 4] },
]

/** Default number of frame times a meter keeps — about two seconds at 60 fps. */
export const FRAME_HISTORY = 120

export interface FrameMeterOptions {
  /** How much time (ms) each FPS reading averages over. */
  window?: number
  /** How many recent frame times are kept for a graph. */
  capacity?: number
  /** Gaps longer than this (a hidden tab, a debugger pause) restart the window instead of skewing it. */
  stall?: number
}

/**
 * Rolling frame-rate meter. Feed it the time between frames; it reports the average FPS once
 * per window and keeps the most recent frame times, oldest first, for drawing a graph.
 */
export function createFrameMeter({ window = 500, capacity = FRAME_HISTORY, stall = 250 }: FrameMeterOptions = {}) {
  const frameTimes: number[] = []
  let frames = 0
  let elapsed = 0

  return {
    frameTimes,
    /** Records one frame. Returns a new FPS reading when a window completes, otherwise null. */
    push(delta: number): number | null {
      if (!(delta > 0)) return null
      if (delta > stall) {
        frames = 0
        elapsed = 0
        return null
      }

      frameTimes.push(delta)
      if (frameTimes.length > capacity) frameTimes.shift()

      frames += 1
      elapsed += delta
      if (elapsed < window) return null

      const fps = Math.round((frames * 1000) / elapsed)
      frames = 0
      elapsed = 0
      return fps
    },
  }
}

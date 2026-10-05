/**
 * A random index into a list of `length` items. Pass `exclude` to never land on the
 * current one, so a shuffle always changes what is on screen.
 */
export function pickIndex(
  length: number,
  exclude?: number,
  random: () => number = Math.random,
): number {
  if (length <= 1) return 0
  const skip = exclude !== undefined && exclude >= 0 && exclude < length
  const pick = Math.floor(random() * (skip ? length - 1 : length))
  return skip && pick >= exclude ? pick + 1 : pick
}

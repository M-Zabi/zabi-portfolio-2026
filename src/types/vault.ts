/** Where the site says it is based — the real one, or a private page's override. */
export interface HomeBase {
  city: string
  region: string
  country: string
  /** Short form shown on cards and tiles, e.g. "Bengaluru, India". */
  location: string
  latitude: number
  longitude: number
}

/** The landing page, remixed: a different hero and a different home town. */
export interface HomeRemixPage {
  kind: 'home-remix'
  /** Shown on the curtain while the page opens. */
  curtain: string
  /** The two fixed hero lines (the third rotates). */
  heroLines: [string, string]
  /** The rotating third line. */
  words: string[]
  home: HomeBase
}

/** Everything a sealed vault can decrypt to. Add new kinds of easter egg here. */
export type VaultPage = HomeRemixPage

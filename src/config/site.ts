/**
 * Everything personal lives here — every claim the site makes about you is in this file or in
 * `src/content/`. Values marked TODO are placeholders: the production build checks the obvious
 * ones (email, URL, social links, sample records) and refuses to ship them.
 *
 * This module is also read at build time (route meta, sitemap, structured data), so it must
 * stay free of browser-only APIs.
 */

export interface NavItem {
  label: string
  to: string
}

export interface SocialLink {
  label: string
  handle: string
  href: string
}

export const site = {
  name: 'Zabi',
  /** TODO: your full name as it should appear on the business card, footer and metadata. */
  fullName: 'Zabi',
  role: 'Senior Full-stack & Mobile Engineer',
  shortRole: 'Full-stack · React Native · Desktop',
  description:
    'Bengaluru-based senior full-stack engineer building web platforms, React Native apps and Tauri/Electron desktop tools — with smooth workflows and interactive experiences at the core.',
  /**
   * Production origin, no trailing slash. Set VITE_SITE_URL in your host's environment.
   * (`?.` because this file is also evaluated at build time, where import.meta.env is absent.)
   */
  url: (import.meta.env?.VITE_SITE_URL as string | undefined) ?? 'https://example.com',
  /** TODO: public contact address. */
  email: 'hello@example.com',
  location: 'Bengaluru, India',
  /** Home base — the footer and contact page (with the flag), the weather report and structured data. */
  home: {
    city: 'Bengaluru',
    region: 'Karnataka',
    country: 'India',
    countryCode: 'IN',
    latitude: 12.9716,
    longitude: 77.5946,
  },
  /** IANA zone used by every "local time" readout — India Standard Time. */
  timeZone: 'Asia/Kolkata',
  /** TODO: first year you shipped professionally — drives "Est." and years-of-experience copy. */
  startedYear: 2016,
  availability: {
    open: true,
    /** TODO */
    label: 'Booking projects for Q1 2027',
  },
  /** TODO: only promise what you can keep. */
  replyTime: 'Replies within one business day',
  /** TODO: shown in the workflow tile. */
  typicalEngagement: '4–12 weeks',
  /** TODO: list only stores and platforms you have actually shipped to. */
  shippedTo: ['App Store', 'Google Play', 'Mac App Store', 'Microsoft Store', 'Snapcraft', 'The open web'],
  nav: [
    { label: 'Home', to: '/' },
    { label: 'Work', to: '/work' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ] satisfies NavItem[],
  /** TODO: real profile URLs (bare domains like https://github.com/ fail the production build). */
  socials: [
    { label: 'GitHub', handle: '@zabi', href: 'https://github.com/' },
    { label: 'LinkedIn', handle: 'in/zabi', href: 'https://www.linkedin.com/' },
    { label: 'X', handle: '@zabi', href: 'https://x.com/' },
    { label: 'Dribbble', handle: 'zabi', href: 'https://dribbble.com/' },
  ] satisfies SocialLink[],
} as const

export const yearsOfExperience = new Date().getFullYear() - site.startedYear

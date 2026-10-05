/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** POST endpoint for the contact form. When unset, the form opens a pre-filled email. */
  readonly VITE_CONTACT_ENDPOINT?: string
  /** Canonical origin, e.g. https://zabi.dev */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

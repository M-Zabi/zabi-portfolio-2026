import type { App } from 'vue'

/**
 * The single funnel for runtime errors. To add a monitoring service (Sentry, Highlight,
 * Bugsnag…), initialise it in `installErrorReporting` and forward from `reportError` —
 * nothing else in the app needs to change.
 */
export function reportError(error: unknown, context = 'app') {
  console.error(`[${context}]`, error)
}

export function installErrorReporting(app: App) {
  app.config.errorHandler = (error, _instance, info) => reportError(error, `vue:${info}`)
  window.addEventListener('unhandledrejection', (event) => reportError(event.reason, 'unhandledrejection'))
}

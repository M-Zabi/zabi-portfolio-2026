// Applies the saved theme before first paint so there is never a light/dark flash.
// External (not inline) so the Content Security Policy can forbid inline scripts.
// VueUse's useStorage writes string preferences raw: light | dark | system.
;(function () {
  try {
    var stored = localStorage.getItem('zabi-theme') || 'system'
    var dark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
    var meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', dark ? '#191512' : '#f7f4ef')
  } catch (error) {
    /* Storage blocked — the app applies the system theme on boot. */
  }
})()

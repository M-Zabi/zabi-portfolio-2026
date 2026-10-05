import '@fontsource-variable/mona-sans/wdth.css'
import '@fontsource-variable/schibsted-grotesk/wght.css'
import '@fontsource-variable/martian-mono/wdth.css'
import 'vue-sonner/style.css'
import './styles/main.css'

import { VueQueryPlugin } from '@tanstack/vue-query'
import { createHead } from '@unhead/vue/client'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { installErrorReporting } from './lib/monitoring'
import { queryClient } from './lib/query-client'
import { router } from './router'

const app = createApp(App)
installErrorReporting(app)

app.use(createPinia())
app.use(router)
app.use(createHead())
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')

import { createApp, h } from 'vue'
import App from './App.vue'
import ThemeSwitch from './ThemeSwitch.vue'
import { install } from 'vexip-ui'

const Repl = {
  name: 'Repl',
  setup() {
    return () => h('div', [h(App), h(ThemeSwitch)])
  }
}

const mount = () => {
  const app = (window.__app__ = createApp(Repl).use(install))

  app.config.unwrapInjectedRef = true
  app.config.errorHandler = e => console.error(e)
  app.mount('#app')
}

new Promise((resolve, reject) => {
  const id = '__vexip_style__'
  const old = document.querySelector(`#${id}`)
  const href = '__VEXIP_UI_STYLE__'

  if (old && old.href === href) {
    resolve()
    return
  }

  const link = old || document.createElement('link')

  link.id = '__vexip_style__'
  link.rel = 'stylesheet'
  link.href = href

  link.onload = resolve
  link.onerror = reject

  document.head.insertBefore(link, document.head.firstChild)
}).then(mount)
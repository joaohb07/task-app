import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/main.scss'

const app = createApp(App)

/**
 * Initializes the Vue application by setting up Pinia for state management and Vue Router for routing.
 * Mounts the application to the DOM element with the ID 'app'.
 */
app.use(createPinia())
app.use(router)
app.mount('#app')
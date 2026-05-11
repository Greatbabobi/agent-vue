import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'
import { useChatStore } from './stores/chat'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(ElementPlus)
app.use(router)
app.mount('#app')

// Restore conversations from localStorage on startup
const store = useChatStore()
store.loadFromStorage()

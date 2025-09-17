import './styles/global.css';
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// Buffer polyfill for browser compatibility with ethers.js
import { Buffer } from 'buffer'
window.Buffer = Buffer

createApp(App).use(router).mount('#app')

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initTheme } from '@/components/ThemeSwitcher'

// Apply saved theme before first render
initTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

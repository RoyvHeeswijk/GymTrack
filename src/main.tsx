import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyDeviceClasses } from './lib/device'
import './index.css'
import App from './App.tsx'

applyDeviceClasses()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

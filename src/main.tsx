import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { languageTag } from './i18n'
import { requestPersistentStorage } from './lib/storage'
import { startUpdates } from './lib/updates'
import './index.css'

startUpdates()
void requestPersistentStorage()

document.documentElement.lang = languageTag

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

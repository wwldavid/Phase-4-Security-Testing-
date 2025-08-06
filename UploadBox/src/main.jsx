import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LoggedInUserProvider from './context/LoggedInUserContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoggedInUserProvider>
      <App />
    </LoggedInUserProvider>
  </StrictMode>,
)

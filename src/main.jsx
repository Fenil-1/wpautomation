import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DevSessionConsole from './dev/DevSessionConsole.jsx'
import ContactsPage from './contacts-ui/ContactsPage.jsx'

// Lightweight path-based routing shim. Isolated screens live at their own
// paths; every other path renders the normal broadcast application untouched.
//   /dev/session -> Session Debug Console (dev tool)
//   /contacts    -> Contacts + Groups admin (backend-powered)
const path = window.location.pathname
let Root = App
if (path.startsWith('/dev/session')) Root = DevSessionConsole
else if (path.startsWith('/contacts')) Root = ContactsPage

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'uno.css'
import '@unocss/reset/tailwind-compat.css'

import "./css/tailwind.css"

const Main: React.FC = () => {
  return <>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Suspense>
    <Main />
  </Suspense>
)

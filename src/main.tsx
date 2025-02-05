import React, { Suspense, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'uno.css'
import '@unocss/reset/tailwind-compat.css'
import "./css/uno.css"

import { Loading } from './pages/Loading'

const Main: React.FC = () => {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      if (location.protocol !== 'https:') {
        location.replace(`https:${location.href.substring(location.protocol.length)}`);
      }
    }
  }, []);

  return <>
    <Suspense fallback={<Loading />}>
      <App />
    </Suspense>
  </>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
)

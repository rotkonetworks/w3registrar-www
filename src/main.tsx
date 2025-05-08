import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'

import 'uno.css'
import '@unocss/reset/tailwind-compat.css'
import "./css/uno.css"
import "react-responsive-carousel/lib/styles/carousel.min.css";

import App from './App'
import { Loading } from './pages/Loading'

const Main: React.FC = () => {
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

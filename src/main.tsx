import React, { Suspense, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'uno.css'
import '@unocss/reset/tailwind-compat.css'
import "./css/uno.css"
import "react-responsive-carousel/lib/styles/carousel.min.css";

import { Loading } from './pages/Loading'

import { TourProvider } from '@reactour/tour'
import { MAIN_TOUR } from './help/Tours'
import { useDarkMode } from './hooks/useDarkMode'

const Main: React.FC = () => {
  const { isDark } = useDarkMode()

  return <>
    <Suspense fallback={<Loading />}>
      <TourProvider steps={MAIN_TOUR} styles={{
        popover: (style) => ({
          ...style,
          backgroundColor: !isDark 
            ?"hsl(0 0% 100%)"
            :"#2C2B2B"
          ,
        }),
      }}>
        <App />
      </TourProvider>
    </Suspense>
  </>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
)

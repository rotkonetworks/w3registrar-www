import React, { Suspense, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'uno.css'
import '@unocss/reset/tailwind-compat.css'
import "./css/uno.css"
import "react-responsive-carousel/lib/styles/carousel.min.css";

import { Loading } from './pages/Loading'

import { TourProvider, ArrowProps } from '@reactour/tour'
import { MAIN_TOUR } from './help/Tours'
import { useDarkMode } from './hooks/useDarkMode'
import { Button } from './components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const Main: React.FC = () => {
  const { isDark } = useDarkMode()

  return <>
    <Suspense fallback={<Loading />}>
      <TourProvider steps={MAIN_TOUR} 
        components={{
          Arrow: ({ inverted, disabled }: ArrowProps) => (
            <Button
              variant='primary'
              disabled={disabled}
              className='rounded-full h-10 w-10'
            >
              {inverted ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </Button>
          ),
        }}
        styles={{
          popover: (style) => ({
            ...style,
            backgroundColor: !isDark 
              ?"hsl(0 0% 100%)"
              :"#2C2B2B"
            ,
          }),
          badge: (style) => ({
            ...style,
            backgroundColor: "rgb(230 0 122 / 1)",
          }),
          navigation: (style) => ({
            ...style,
            color: "rgb(230 0 122 / 1)",
          }),
        }}
      >
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

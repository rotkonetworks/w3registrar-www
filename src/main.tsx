import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App, { appState } from './App'
import 'uno.css'
import '@unocss/reset/tailwind-compat.css'
import { ReactiveDotProvider } from '@reactive-dot/react'
import { config } from './api/config'
import { useSnapshot } from 'valtio'

const Main: React.FC = () => {
  const appStateSnap = useSnapshot(appState)
  
  return <>
    <React.StrictMode>
      <ReactiveDotProvider config={config}>
        {appStateSnap.chain.id &&
          <div className='dark:bg-black min-h-0px'>
            <App />
          </div>
        }
      </ReactiveDotProvider>
    </React.StrictMode>
  </>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Suspense>
    <Main />
  </Suspense>
)

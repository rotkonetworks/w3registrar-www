import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { appState } from './App'
import 'uno.css'
import '@unocss/reset/tailwind-compat.css'
import { ChainProvider, ReactiveDotProvider } from '@reactive-dot/react'
import { config } from './api/config'


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ReactiveDotProvider config={config}>
      <ChainProvider chainId={config[appState.chain]}>
        <div className='dark:bg-black min-h-0px'>
          <App />
        </div>
      </ChainProvider>
    </ReactiveDotProvider>
  </React.StrictMode>
)

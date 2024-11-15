import type React from 'react'
import { lazy } from 'react'
import { IdentityRegistrarComponent } from '~/components/identity-registrar'

const ErrorPage = lazy(() => import('~/pages/error-page'))

export interface RouteType {
  path: string
  element: React.FC
  meta?: {
    title: string
  }
}

const routes: RouteType[] = [
  {
    path: '/',
    element: IdentityRegistrarComponent,
    meta: {
      title: 'Home'
    }
  },
  {
    path: '*',
    element: ErrorPage,
    meta: {
      title: 'Page not found'
    }
  }
]

export { routes }

import type { AttributifyAttributes } from '@unocss/preset-attributify'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface HTMLAttributes<_T> extends AttributifyAttributes {}
}
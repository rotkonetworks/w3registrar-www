import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      setDark(event.matches)
    });
  })
  useEffect(() => {
    console.log({ isDark })
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])
  const setDark = (value: boolean) => {
    setIsDark(value)
  }

  return { isDark, setDark }
}

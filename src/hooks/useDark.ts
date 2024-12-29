import { useState } from 'react'
export function useDark() {
  // 初始化
  const [isDark, setIsDark] = useState<boolean>(window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      setDark(event.matches)
    });
  })
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [isDark])
  const setDark = (value: boolean) => {
    setIsDark(value)
    document.documentElement.classList.toggle('dark', value)
  }

  return { isDark, setDark }
}

import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { appStore } from "~/store/AppStore";

export function Loading() {
  const { isDarkMode } = useSnapshot(appStore)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])
  
  return (
    <div className={'h-100vh flex-center ' + isDarkMode ? 'bg-[#2C2B2B] text-[#FFFFFF]' : 'bg-[#FFFFFF] text-[#1E1E1E]'}>
      Loading...
    </div>
  );
}

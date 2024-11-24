import { proxy } from "valtio";

type AppStore = {
  isDarkMode: boolean;
  isReady: boolean;
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
  isDevTest: boolean;
};
export const appStore = proxy<AppStore>({
  isDarkMode: true,
  isReady: false,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',
  isDevTest: import.meta.env.MODE === 'development',
});

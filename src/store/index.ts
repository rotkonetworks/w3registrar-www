import { Chains } from '@reactive-dot/core';
import { proxy } from 'valtio'
import { config } from '~/api/config';

export * from './userSore'

interface ChainInfo {
  id: keyof Chains;
  ss58Format?: number;
  tokenDecimals?: number;
  tokenSymbol?: string;
}

export const chainStore: ChainInfo = proxy({
  id: import.meta.env.VITE_APP_DEFAULT_CHAIN || Object.keys(config.chains)[0],
})

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
})

export interface AlertProps {
  type: "success" | "error" | "info" | "loading";
  title: string;
  message: string;
  key: string;
  closable: boolean;
  duration: number;
}
export const AlertsStore = proxy<Record<string, AlertProps>>({  })
export const pushAlert = (alert: AlertProps) => {
  AlertsStore[alert.key] = alert;
}
export const removeAlert = (key: string) => {
  delete AlertsStore[key];
}

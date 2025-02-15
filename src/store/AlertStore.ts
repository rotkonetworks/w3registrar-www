import { proxyMap } from "valtio/utils";


export interface AlertProps {
  type: "success" | "error" | "info" | "loading";
  title?: string;
  message: string;
  key: string;
  closable?: boolean;
  duration?: number;
}
export const alertsStore = proxyMap<string, AlertProps>(); // Map to ensure insertion order

export type AlertPropsOptionalKey = AlertProps | Omit<AlertProps, "key">

export const pushAlert = (alert: AlertProps) => {
  alertsStore.set(alert.key, alert);
};
export const removeAlert = (key: string) => {
  alertsStore.delete(key);
};

import { useProxy } from "valtio/utils"

export interface AlertProps {
  type: "success" | "error" | "info" | "loading";
  title: string;
  message: string;
  key: string;
}

export const useAlerts = (context: Record<string, AlertProps>) => {
  const alerts = useProxy(context)

  const push = (alert: AlertProps) => {
    alerts[alert.key] = alert;
  }

  const remove = (key: string) => {
    delete alerts[key];
  }

  return {alerts, push, remove}
}

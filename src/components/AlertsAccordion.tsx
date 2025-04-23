import { Bell } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Button } from "./ui/button"
import { AlertProps } from "~/hooks/useAlerts"

interface AlertsAccordionProps {
  alerts: [string, AlertProps][] | Map<string, AlertProps>;
  removeAlert: (key: string) => void;
  count?: number;
  className?: string;
}

export const AlertsAccordion = ({
  alerts,
  removeAlert,
  count,
  className = "",
}: AlertsAccordionProps) => {
  const alertEntries = alerts instanceof Map ? Array.from(alerts.entries()) : alerts;
  const alertCount = count ?? alertEntries.length;
  
  if (alertCount === 0) return null;

  return (
    <div
      className={`fixed bottom-[2rem] left-[2rem] z-[9999] max-w-sm max-h-sm isolate pointer-events-auto font-mono ${className}`}
    >
      <Accordion type="single" collapsible defaultValue="notifications">
        <AccordionItem value="notifications">
          <AccordionTrigger 
            className="rounded-full p-2 bg-[#E6007A] text-[#FFFFFF] dark:bg-[#BC0463] dark:text-[#FFFFFF] hover:no-underline"
          >
            <Bell className="h-6 w-6" /> {alertCount}
          </AccordionTrigger>
          <AccordionContent
            className="bg-[#FFFFFF] dark:bg-[#2C2B2B] p-2 rounded-lg overflow-y-auto max-h-sm"
          >
            {alertEntries.map(([_, alert]) => (
              <Alert
                key={alert.key}
                variant={alert.type === 'error' ? "destructive" : "default"}
                className={`mb-4 ${alert.type === 'error'
                  ? 'bg-red-200 border-[#E6007A] text-red-800 dark:bg-red-800 dark:text-red-200'
                  : 'bg-[#FFE5F3] border-[#E6007A] text-[#670D35] dark:bg-[#393838] dark:text-[#FFFFFF]'
                }`}
              >
                <AlertTitle>{alert.type === 'error' ? 'Error' : 'Notification'}</AlertTitle>
                <AlertDescription className="flex flex-col justify-between items-center">
                  <span className="font-mono">{alert.message}</span>
                  {alert.closable === true && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAlert(alert.key)}
                    >
                      Dismiss
                    </Button>
                  )}
                  {alert.seeDetails && (
                    <Button variant="primary" size="sm" onClick={alert.seeDetails}>See Details</Button>
                  )}

                </AlertDescription>
              </Alert>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

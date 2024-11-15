import { AlertProps, useAlerts } from "~/hooks/useAlerts";

interface AlertCanvasProps {
  context: Record<string, AlertProps>,
}

export const AlertCanvas = ({context}: AlertCanvasProps) => {
  const { alerts, remove } = useAlerts(context)

  return <>
    <div className="pos-fixed bottom-10 right-10 border-rounded-3 p2 flex flex-col justify-center text-2xl items-start">
      <Alert 
        type="success"
        message="Item moved successfully."
      />
      <Alert
        type="error" 
        message="Item has been deleted."
      />
      <Alert
        type="warning"
        message="Improve password difficulty."
      />
      <Alert 
        type="loading"
        message="Please wait."
      />
    </div>
  </>;
}

const Alert = (alert: AlertProps) => {
  const icons = {
    success: (
      <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" />
      </svg>
    ),
    loading: (
      <svg width="24" height="24" stroke="#000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <g>
          <circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" dur="1.5s" calcMode="spline" values="0 150;42 150;42 150;42 150" keyTimes="0;0.475;0.95;1" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" repeatCount="indefinite" />
            <animate attributeName="stroke-dashoffset" dur="1.5s" calcMode="spline" values="0;-16;-59;-59" keyTimes="0;0.475;0.95;1" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" repeatCount="indefinite" />
          </circle>
          <animateTransform attributeName="transform" type="rotate" dur="2s" values="0 12 12;360 12 12" repeatCount="indefinite" />
        </g>
      </svg>
    )
  };

  const styles = {
    success: "text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200",
    error: "text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200", 
    warning: "text-orange-500 bg-orange-100 dark:bg-orange-700 dark:text-orange-200",
    loading: "text-orange-500 bg-orange-100 dark:bg-orange-700 dark:text-orange-200"
  };

  return (
    <div className="flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800" role="alert">
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${styles[alert.type]}`}>
        {icons[alert.type]}
        <span className="sr-only">{alert.type} icon</span>
      </div>
      <div className="ms-3 text-sm font-normal">{alert.message}</div>
      <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-warning" aria-label="Close">
        <span className="sr-only">Close</span>
        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
        </svg>
      </button>
    </div>
  );
}

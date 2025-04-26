import { StepType } from "@reactour/tour";

export const MAIN_TOUR: StepType[] = [
  {
    selector: ".AccountSelect",
    content: <div>
      <p className="text-sm">
        Select an account to use with this identity. You can also create a new account.
      </p>
    </div>,
  }, 
  {
    selector: ".NetworkSelect",
    content: <div>
      <p className="text-sm">
        Select a network to use with this identity. You can also create a new network.
      </p>
    </div>,
  }
]

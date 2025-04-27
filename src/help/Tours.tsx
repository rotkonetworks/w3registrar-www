import { StepType } from "@reactour/tour";

export const HeaderSteps: StepType[] = [
  {
    selector: ".AccountSelect",
    content: <div>
      <p className="text-sm">
        Select an account to use to manage identity. You can also manage connections to wallets.
        Balance is shown here for every connected account.
      </p>
    </div>,
  }, 
  {
    selector: ".NetworkSelect",
    content: <div>
      <p className="text-sm">
        Select a network in which to manage your identity.
      </p>
    </div>,
  },
  {
    selector: ".MainBalanceDisplay",
    content: <div>
      <p className="text-sm">
        This is your main balance for chosen account on this network. Balance will always be shown in transaction 
        dialogs to help, for your convenience.
      </p>
    </div>,
  },
  {
    selector: ".HeaderActions",
    content: <div>
      <p className="text-sm">
        These are various controls for the app, that let you display help dialog and toggle dark mode.
      </p>
    </div>,
  }
]

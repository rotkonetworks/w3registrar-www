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

export const MainTabsSteps: StepType[] = [
  {
    selector: ".identityFormTab",
    content: <div>
      <p className="text-sm">
        Fill in your identity information here. This is the first step in creating your on-chain identity.
        Provide personal details that will be securely stored on the blockchain.
      </p>
    </div>,
  },
  {
    selector: ".challengesTab",
    content: <div>
      <p className="text-sm">
        Complete verification challenges to prove your identity. This step becomes available 
        after submitting your identity form and paying the required fee.
      </p>
    </div>,
  },
  {
    selector: ".statusTab",
    content: <div>
      <p className="text-sm">
        View your identity verification status here. You can check which steps are completed 
        and what remains to be done in your verification process.
      </p>
    </div>,
  },
  {
    selector: ".subaccountsTab",
    content: <div>
      <p className="text-sm">
        Manage your identity subaccounts. Create hierarchical relationships between accounts and
        establish connections between your different blockchain addresses.
      </p>
    </div>,
  }
]

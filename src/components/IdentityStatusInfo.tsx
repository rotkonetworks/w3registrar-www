import { Info } from "lucide-react";
import { verifiyStatuses } from "~/store/IdentityStore";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export const IdentityStatusInfo = ({ status }: { status: verifiyStatuses }) => <>
  <Alert variant="default" 
    className="dark:bg-[#393838] bg-[#ffffff] border-[#E6007A] dark:text-light text-dark"
  >
    <Info className="h-4 w-4" />
    <AlertTitle>On-chain Identity Status
      : <strong className={
        status === verifiyStatuses.NoIdentity
          ? "dark:text-red-300 text-red-700"
          : status === verifiyStatuses.IdentitySet
            ? "dark:text-orange-300 text-orange-700"
            : status === verifiyStatuses.IdentityVerified
              ? "dark:text-green-300 text-green-700"
              : "dark:text-yellow-300 text-yellow-700"
      }>
        {verifiyStatuses[status]?.match(/[A-Z][a-z]+/g).join(" ") || "Unknown"}
      </strong>
    </AlertTitle>
    <AlertDescription>
      {status === verifiyStatuses.NoIdentity
        && "No identity set. You need to set your identity before requesting judgement."
      }
      {status === verifiyStatuses.IdentitySet
        && "Identity already set. You can update your identity or request judgement."
      }
      {status === verifiyStatuses.JudgementRequested
        && "Judgement request sent. You should pay the fee, which is 0.2 DOT."
      }
      {status === verifiyStatuses.FeePaid
        && "Judgement reqyested and paid fee. You need to complete the challenges."
      }
      {status === verifiyStatuses.IdentityVerified
        && "Your identity is verified! Congrats!"
      }
    </AlertDescription>
  </Alert>
</>

import { Info } from "lucide-react";
import { verifiyStatuses } from "~/store/IdentityStore";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export const IdentityStatusInfo = ({ status }: { status: verifiyStatuses }) => <>
  <Alert variant="default" className="bg-[#393838] border-[#E6007A] text-[#FFFFFF]">
    <Info className="h-4 w-4" />
    <AlertTitle>On-chain Identity Status
      : <strong>{verifiyStatuses[status]?.match(/[A-Z][a-z]+/g).join(" ") || "Unknown"}</strong>
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

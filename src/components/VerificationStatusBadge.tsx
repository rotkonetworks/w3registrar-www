
import { verifiyStatuses } from "~/store/IdentityStore";
import { Badge } from "./ui/badge";

export function VerificationStatusBadge({ status }: { status: number }) {
  return (
    status == verifiyStatuses.IdentityVerified ?
      <Badge variant="success" className="bg-[#E6007A] text-[#FFFFFF]">Verified</Badge> :
      <Badge variant="destructive" className="bg-[#670D35] text-[#FFFFFF]">Not Verified</Badge>
  )
}
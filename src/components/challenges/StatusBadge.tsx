import { Badge } from "@/components/ui/badge"
import { ChallengeStatus } from "~/store/challengesStore"

export const StatusBadge = ({ status }: { status: ChallengeStatus }) => {
  switch (status) {
    case ChallengeStatus.Passed:
      return <Badge variant="success" className="bg-[#E6007A] text-[#FFFFFF]">Verified</Badge>
    case ChallengeStatus.Failed:
      return <Badge variant="destructive" className="bg-[#670D35] text-[#FFFFFF]">Failed</Badge>
    default:
      return <Badge variant="secondary">Pending</Badge>
  }
}

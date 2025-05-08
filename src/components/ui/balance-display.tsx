import { Badge } from "@/components/ui/badge";
import { AssetAmount } from "@/types";


export const BalanceDisplay = ({ balance, formatter }: {
  balance: AssetAmount,
  formatter: (_v: AssetAmount) => string,
}) => {
  return <Badge variant={balance ? "default" : "secondary"}>
    {formatter(balance)}
  </Badge>;
}

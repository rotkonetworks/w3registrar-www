import { AssetAmount, FormatAmountFn, FormatAmountOptions } from "~/types";
import { Badge } from "./badge";

export const BalanceDisplay = ({ balance, formatter }: {
  balance: AssetAmount,
  formatter: (v: AssetAmount) => string,
}) => {
  return <Badge variant={balance ? "default" : "secondary"}>
    {formatter(balance)}
  </Badge>;
}

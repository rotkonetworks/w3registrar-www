import { AssetAmount, FormatAmountFn, FormatAmountOptions } from "~/types";
import { Badge } from "./badge";
import { cn } from "~/lib/utils";
import { HTMLAttributes } from "react";

export const BalanceDisplay = ({ balance, formatter, ...props }: {
  balance: AssetAmount,
  formatter: (v: AssetAmount) => string,
} & Omit<HTMLAttributes<HTMLDivElement>, "size">) => {
  return <Badge {...props} variant={balance ? "default" : "secondary"} 
    className={cn("flex items-center gap-2", props.className)}
  >
    {formatter(balance)}
  </Badge>;
}

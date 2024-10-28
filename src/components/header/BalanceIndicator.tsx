import BigNumber from "bignumber.js"
import { useEffect } from "react"
import { useSnapshot } from "valtio"
import { appState } from "~/App"

export const BalanceIndicator: React.FC = () => {
  const appStateSnap = useSnapshot(appState)

  useEffect(() => {
    import.meta.env.DEV && console.log({
      free: Number(appStateSnap.account.balance?.free) / 10 ** appStateSnap.chain.tokenDecimals,
      freeBalance: appStateSnap.account.balance?.free,
      decimals: appStateSnap.chain.tokenDecimals,
      chainData:  {...appStateSnap.chain },
    })
  }, [appStateSnap.account.balance, appStateSnap.chain])
  const free = BigNumber(appStateSnap.account.balance?.free.toString())
    .dividedBy(BigNumber(10).pow(appStateSnap.chain.tokenDecimals))
  
  return <>
    Free: {free.toString()} {appStateSnap.chain.tokenSymbol}
  </>
}

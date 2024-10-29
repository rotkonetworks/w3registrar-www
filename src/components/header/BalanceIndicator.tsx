import BigNumber from "bignumber.js"
import { useEffect, useMemo } from "react"
import { useSnapshot } from "valtio"
import { appState } from "~/App"

const strings = {
  requestJdgement: "Request Judgement",
  setIdentityAndRequestJudgement: "Set id. and req. judg."
}

export const BalanceIndicator: React.FC = () => {
  const appStateSnap = useSnapshot(appState)

  const formatValue = (amount: bigint | undefined): string => {
    if (!amount) {
      return "...";
    }
    amount = amount.toString()
    amount = BigNumber(amount).dividedBy(BigNumber(10).pow(appStateSnap.chain.tokenDecimals));
    return `${amount.toLocaleString()} ${appStateSnap.chain.tokenSymbol}`;
  }

  useEffect(() => {
    import.meta.env.DEV && console.log({
      free: Number(appStateSnap.account.balance?.free) / 10 ** appStateSnap.chain.tokenDecimals,
      freeBalance: appStateSnap.account.balance?.free,
      decimals: appStateSnap.chain.tokenDecimals,
      chainData:  {...appStateSnap.chain },
    })
  }, [appStateSnap.account.balance, appStateSnap.chain])
  
  return <>
    <table>
      <tr>
        <th>Free</th>
        <td className="align-right">{formatValue(appStateSnap.account.balance?.free)}</td>
      </tr>
      <tbody>
        {Object.entries({ ...appStateSnap.fees })
          .filter(([key, amount]) => amount)
          .map(([key, amount]) => <tr>
            <th>{strings[key]}</th>
            <td className="align-right">{formatValue(amount)}</td>
          </tr>)
        }
      </tbody>
    </table>
  </>
}

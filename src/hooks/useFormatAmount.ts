import { useCallback } from 'react';
import { formatAmount } from '~/utils';
import type { FormatAmountOptions } from '~/types';
import type BigNumber from 'bignumber.js';

/**
 * Hook that returns a formatting function preconfigured with chain properties
 * 
 * @param props - Chain properties to use for formatting
 * @returns A memoized formatting function
 */
export function useFormatAmount(props: FormatAmountOptions) {
  const { symbol, tokenDecimals, decimals } = props;
  
  return useCallback((
    amount: number | bigint | BigNumber | string,
  ) => {
    return formatAmount(amount, { tokenDecimals, symbol, decimals, });
  }, [symbol, tokenDecimals]);
}

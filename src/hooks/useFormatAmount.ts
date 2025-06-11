import type BigNumber from 'bignumber.js';
import { useCallback } from 'react';

import type { FormatAmountOptions } from '~/types';
import { formatAmount } from '~/utils';

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
  }, [decimals, symbol, tokenDecimals]);
}

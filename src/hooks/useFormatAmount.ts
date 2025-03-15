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
export function useFormatAmount(props: { 
  tokenSymbol?: string;
  tokenDecimals?: number;
}) {
  const { tokenSymbol, tokenDecimals } = props;
  
  return useCallback((
    amount: number | bigint | BigNumber | string,
    options?: FormatAmountOptions,
  ) => {
    return formatAmount(amount, {
      tokenDecimals: options?.tokenDecimals ?? tokenDecimals ?? 0,
      symbol: options?.symbol ?? tokenSymbol ?? '',
      decimals: options?.decimals,
    });
  }, [tokenSymbol, tokenDecimals]);
}

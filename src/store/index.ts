import { Chains } from '@reactive-dot/core';
import { proxy } from 'valtio'
import { config } from '~/api/config';

export * from './userSore'

interface ChainInfo {
  id: keyof Chains;
  ss58Format?: number;
  tokenDecimals?: number;
  tokenSymbol?: string;
}

export const chainStore: ChainInfo = proxy({
  id: import.meta.env.VITE_APP_DEFAULT_CHAIN || Object.keys(config.chains)[0],
})

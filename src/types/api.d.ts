import type { Transaction, UnsafeTransaction, StorageDescriptor, TxOptions } from "polkadot-api";

export type ApiTx = UnsafeTransaction<unknown | any, string, string, any> 
  | Transaction<unknown | any, string, string, any>

export type ApiStorage = StorageDescriptor<any, any, boolean, string> & {
  getValue: (...args: unknown, options?: TxOptions) => Promise<any>
}

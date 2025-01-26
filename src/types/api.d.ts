import type { Transaction, UnsafeTransaction, StorageDescriptor } from "polkadot-api";

export type ApiTx = UnsafeTransaction<unknown | any, string, string, any> 
  | Transaction<unknown | any, string, string, any>

export type ApiStorage = StorageDescriptor<any, any, boolean, string> & {
  getValue: (...args: unknown, options: { at?: "best" | "finalized" }) => Promise<any>
}

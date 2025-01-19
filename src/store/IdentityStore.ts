import { IdentityData, IdentityJudgement } from "@polkadot-api/descriptors";
import { Binary, FixedSizeBinary, SS58String, StorageDescriptor } from "polkadot-api";
import { proxy } from "valtio";

export interface IdentityFormData {
  discord?: string;
  display?: string;
  email?: string;
  github?: string;
  image?: string;
  legal?: string;
  matrix?: string;
  twitter?: string;
  web?: string;
}

export type IdentityOf = StorageDescriptor<[Key: SS58String], [{
  deposit: bigint;
  info: {
    discord: IdentityData;
    display: IdentityData;
    email: IdentityData;
    github: IdentityData;
    image: IdentityData;
    legal: IdentityData;
    matrix: IdentityData;
    pgp_fingerprint?: FixedSizeBinary<20>;
    twitter: IdentityData;
    web: IdentityData;
  };
  judgements: [number, IdentityJudgement][];
}, Binary | undefined], true, "identityOf">;

export type IdentityOfResult = {
  type: string;
  value: IdentityOf;
}

export enum verifiyStatuses {
  Unknown = -1,
  NoIdentity = 0,
  IdentitySet = 1,
  JudgementRequested = 2,
  FeePaid = 3, // Ready to complete challenges
  IdentityVerified = 4, // Judgement is deemed Reasonable, KnownGood, or any other afformative state
}

export interface Judgement {
  registrar: {
    index: number;
  };
  state: "FeePaid" | "OutOfDate" | "Reasonable" | "KnownGood" | "Erroneous" | "LowQuality";
  fee: bigint;
}

export interface IdentityStore {
  info?: IdentityFormData;
  judgements?: Judgement[];
  status: verifiyStatuses;
  hash?: Uint16Array;
  deposit?: bigint;
}

export const identityStore = proxy<IdentityStore>({
  status: verifiyStatuses.Unknown,
});
export const updateIdentity = (info: IdentityFormData) => {
  identityStore.info = info
}

import { ChainId } from "@reactive-dot/core";
import { ChainDescriptorOf } from "@reactive-dot/core/internal.js";
import { TypedApi, SS58String, Binary } from "polkadot-api";
import { AccountTreeNode } from "~/hooks/UseAccountsTree";
import { ApiStorage } from "~/types/api";

type SubsOfResult = {
  deposit: bigint,
  subs: SS58String[],
};

export const fetchSubsOf = async (
  api: TypedApi<ChainDescriptorOf<ChainId>>,
  address: SS58String
): Promise<SubsOfResult | null> => {
  if (!api) {
    throw new Error("API not provided to fetchSubaccounts");
  }
  if (!address) {
    throw new Error("Address not provided to fetchSubaccounts");
  }

  try {
    // Fetch subaccounts information from chain
    const result: [bigint, SS58String[]] | null = await (api.query.Identity.SubsOf as ApiStorage)
      .getValue(address, { at: "best" });
    
    if (!result) return null;

    return {
      deposit: result[0],
      subs: result[1],
    };
  } catch (error) {
    throw new Error("Error fetching subaccounts", error);
  }
}

type SuperOfResult = {
  address: SS58String,
  name?: string,
} | null;

export const fetchSuperOf = async (
  api: TypedApi<ChainDescriptorOf<ChainId>>,
  address: SS58String
): Promise<SuperOfResult | null> => {
  if (!api) {
    throw new Error("API not provided to fetchSuperOf");
  }
  if (!address) {
    throw new Error("Address not provided to fetchSuperOf");
  }

  try {
    // Fetch superaccount information from chain
    const result: [SS58String, {
      type: string,
      value?: Binary,
    }] | null = await (api.query.Identity.SuperOf as ApiStorage).getValue(address, { at: "best" });
      
    if (!result) return null;
    // TODO Handle other types of superaccount data
    const name = result[1].type.startsWith("Raw") ? result[1].value.asText() : null;

    return {
      address: result[0],
      name,
    };
  } catch (error) {
    throw new Error("Error fetching superaccount", error);
  }
}

export type RawType = `Raw${number}`;

export type RawSubs = [SS58String, {
  type: RawType,
  value: Binary,
}][];
export const prepareRawSetSubs = (node: AccountTreeNode) => node.subs?.map(sub => [
  sub.address, {
    type: `Raw${sub.name.length}`,
    value: Binary.fromText(sub.name),
  }
]) || []

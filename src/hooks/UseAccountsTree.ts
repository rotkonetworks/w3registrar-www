import { ChainId } from "@reactive-dot/core";
import { ChainDescriptorOf } from "@reactive-dot/core/internal.js";
import { SS58String, TypedApi } from "polkadot-api";
import { useEffect, useState } from "react";
import { fetchSubsOf, fetchSuperOf } from "~/utils/subaccounts";

export type AccountTreeNode = {
  address: SS58String,
  name?: string,
  deposit?: bigint,
  super?: AccountTreeNode,
  subs?: AccountTreeNode[],
  isCurrentAccount?: boolean,
  isDirectSubOfCurrentAccount?: boolean,
};

/**
 * Recursive function to build the account hierarchy
 * @param api TypedApi instance
 * @param address Address to start building from
 * @param currentAddress The currently selected user account
 * @param visitedAddresses Set of already visited addresses to prevent infinite loops
 * @param maxDepth Maximum recursion depth
 */
async function buildAccountHierarchy(
  api: TypedApi<ChainDescriptorOf<ChainId>>,
  address: SS58String,
  currentAddress: SS58String,
  visitedAddresses = new Set<string>(),
  maxDepth = 5, // Prevent too deep recursion
  currentDepth = 0
): Promise<AccountTreeNode | null> {
  // Special case: Always process the current address even if visited
  const isCurrentAccount = address === currentAddress;
  
  // Prevent infinite loops and too deep recursion
  // But make an exception for the current account to ensure it's included
  if ((visitedAddresses.has(address) && !isCurrentAccount) || currentDepth >= maxDepth) {
    return null;
  }
  
  try {
    // Create the base node
    const node: AccountTreeNode = {
      address,
      isCurrentAccount
    };
    
    if (import.meta.env.DEV) console.log(`Building node for: ${address}, isCurrentAccount: ${node.isCurrentAccount}`);

    // Try to fetch super account (parent)
    const superAccount = await fetchSuperOf(api, address);
    if (superAccount && !visitedAddresses.has(superAccount.address)) {
      // Recursively get the super's hierarchy
      node.super = await buildAccountHierarchy(
        api,
        superAccount.address,
        currentAddress,
        visitedAddresses,
        maxDepth,
        currentDepth + 1
      );
      
      if (node.super) {
        if (import.meta.env.DEV) console.log(`Set super for ${address}: ${superAccount.address}`);
      }
    }

    // Fetch subaccounts
    const subsResult = await fetchSubsOf(api, address);
    if (subsResult && subsResult.subs.length > 0) {
      node.deposit = subsResult.deposit;
      node.subs = [];
      
      if (import.meta.env.DEV) console.log(`Found ${subsResult.subs.length} subaccounts for ${address}`);
      
      // Process each subaccount
      for (const subAddress of subsResult.subs) {
        // Process subaccount even if visited when it's the current account
        if (!visitedAddresses.has(subAddress) || subAddress === currentAddress) {
          const subNode = await buildAccountHierarchy(
            api, 
            subAddress,
            currentAddress,
            visitedAddresses,
            maxDepth,
            currentDepth + 1
          );
          
          if (subNode) {
            // Get subaccount name if available
            try {
              const subInfo = await fetchSuperOf(api, subAddress);
              if (subInfo) {
                subNode.name = subInfo.name;
              }
              subNode.super = node; // Set the current node as the super for the subaccount
            } catch (error) {
              console.error(`Error fetching name for ${subAddress}:`, error);
            }
            
            // Mark if this subaccount is the current account
            subNode.isCurrentAccount = subNode.address === currentAddress;
            
            if (import.meta.env.DEV) console.log(`Adding subaccount: ${subAddress}, isCurrentAccount: ${subNode.isCurrentAccount}`);
            node.subs.push(subNode);
          }
        }
      }
    }
    visitedAddresses.add(address);

    return node;
  } catch (error) {
    console.error(`Error building hierarchy for address ${address}:`, error);
    return null;
  }
}

/**
 * Find the root of the account hierarchy
 * This walks up the super chain to find the topmost parent
 */
function findRootAccount(node: AccountTreeNode): AccountTreeNode {
  if (!node.super) {
    return node;
  }
  return findRootAccount(node.super);
}

/**
 * Find a specific address within the account tree
 */
function findAccountInTree(node: AccountTreeNode, targetAddress: SS58String): AccountTreeNode | null {
  if (node.address === targetAddress) {
    return node;
  }
  
  if (node.subs) {
    for (const sub of node.subs) {
      const found = findAccountInTree(sub, targetAddress);
      if (found) return found;
    }
  }
  
  return null;
}

export const useAccountsTree = ({ 
  address,
  api 
}: { 
  address: SS58String,
  api: TypedApi<ChainDescriptorOf<ChainId>>
}) => {
  const [accountTree, setAccountTree] = useState<AccountTreeNode | null>(null);
  // Keep logging for accountTree changes
  useEffect(() => {
    if (import.meta.env.DEV) console.log({ accountTree });
  }, [accountTree]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccountHierarchy = async () => {
    if (!address || !api) {
      setLoading(false);
      return;
    }

    try {
      if (import.meta.env.DEV) console.log(`Starting to build hierarchy for ${address}`);
      
      // Build the complete hierarchy starting from the current address
      const hierarchy = await buildAccountHierarchy(api, address, address);
      
      if (hierarchy) {
        // Find the root of the hierarchy to display the full tree
        const rootAccount = findRootAccount(hierarchy);
        
        // Make sure the current account is marked correctly
        const currentAccountNode = findAccountInTree(rootAccount, address);
        if (currentAccountNode) {
          currentAccountNode.isCurrentAccount = true;
        }
        // Mark direct subnodes of current account
        if (currentAccountNode && currentAccountNode.subs) {
          for (const subNode of currentAccountNode.subs) {
            subNode.isDirectSubOfCurrentAccount = true;
          }
        }
        if (import.meta.env.DEV) {
          console.log(`Root account: ${rootAccount.address}`);
          console.log(`Current account found in tree: ${!!currentAccountNode}`);
        }
        
        setAccountTree(rootAccount);
      } else {
        // If no hierarchy found, create a simple node for the current address
        if (import.meta.env.DEV) console.log(`No hierarchy found, creating simple node for ${address}`);
        setAccountTree({
          address,
          isCurrentAccount: true,
          name: "Current Account"
        });
      }
    } catch (err) {
      console.error("Error fetching account hierarchy:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setAccountTree(null);
      if (isMounted) {
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAccountHierarchy();
  }, [address, api]);

  return {
    accountTree,
    loading,
    error,
    refresh: () => {
      if (import.meta.env.DEV) console.log("Refreshing account tree");
      setLoading(true);
      setAccountTree(null);
    }
  };
};

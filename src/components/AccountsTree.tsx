import { Delete, ListTree, Loader2, PenLine, PlusCircle, Unlink, } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { TypedApi, SS58String, Binary } from "polkadot-api";
import { ChainId } from "@reactive-dot/core";
import { ChainDescriptorOf } from "@reactive-dot/core/internal.js";
import { LoadingPlaceholder } from "~/pages/Loading";
import { AccountTreeNode } from "~/hooks/UseAccountsTree";
import { DialogMode, OpenTxDialogArgs_modeSet } from "~/types";
import { Badge } from "./ui/badge";
import { prepareRawSetSubs } from "~/utils/subaccounts";
import { AccountSelector } from "./ui/account-selector";
import { useAccounts } from "@reactive-dot/react";
import { Input } from "./ui/input";

type AccountNodeProps = {
  node: AccountTreeNode;
  isRoot?: boolean;
  onRemove: (subNode: AccountTreeNode) => void;
  onRename: (subNode: AccountTreeNode) => void;
  onQuit: (node: AccountTreeNode) => void;
  isRemoving?: SS58String | null;
};
const getName = (node: AccountTreeNode) => {
  return <>
    {node.name || <>
      {node.address.slice(0, 4)}
      <span className="text-foreground/50">&#x2026;</span>
      {node.address.slice(-4)}
    </>}
  </>
}
const getFqcn = (node: AccountTreeNode) => {
  return <>
    <span>{getName(node)}</span>
    <span className="text-foreground/50 text-thin">
      .
      {node.super ? getFqcn(node.super) : "alt"}
    </span>
  </>;
}

function AccountNode({
  node,
  isRoot = false,
  onRemove,
  onQuit,
  onRename,
  isRemoving,
  // TODO Pass currentNode
}: AccountNodeProps) {
  return (
    <div className={`relative ${isRoot ? '' : 'ml-2 pt-2 pl-4 border-l-2 border-secondary'}`}>
      <div className={`p-3 rounded-lg flex items-center justify-between ${
        node.isCurrentAccount 
          ? 'bg-primary/20 border border-primary' 
          : 'bg-transparent border-secondary border-[0.5px]'
      }`}>
        <div>
          <div className="font-semibold truncate max-w-[300px] sm:max-w-[500px] md:max-w-100">
            {getFqcn(node)}
          </div>
          <div className="text-xs text-muted-foreground truncate max-w-[300px] sm:max-w-[500px] md:max-w-100">
            {node.address}
          </div>
        </div>

        <div className="flex flex-row gap-2 items-center">
          <div className="flex flex-col gap-1 items-end">
            {!node.super && (
              <Badge variant="secondary" className="text-xs">Root</Badge>
            )}
            {isRoot && onRemove && node.subs?.some(sub => sub.isCurrentAccount) && (
              <Badge variant="secondary" className="text-xs">Current is sub</Badge>
            )}
            {node.isCurrentAccount && <Badge variant="default" className="text-xs flex-grow-0 flex-shrink-1">Current</Badge>}

          </div>

          {!isRoot && node.isCurrentAccount && (
            <Button 
              size="icon" 
              variant="secondary"
              className="h-10 w-10 rounded-full"
              title="Quit subaccount"
              onClick={() => onQuit(node)}
              disabled={!!isRemoving}
            >
              {isRemoving === node.address ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="h-4 w-4" />
              )}
            </Button>
          )}
          {node.isDirectSubOfCurrentAccount && onRename && (
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full"
              onClick={() => onRename(node)}
              disabled={!!isRemoving}
              title="Remove subaccount"
            >
              {isRemoving === node.address ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PenLine className="h-4 w-4" />
              )}
            </Button>
          )}
          {node.isDirectSubOfCurrentAccount && onRemove && (
            <Button 
              size="icon" 
              variant="secondary"
              className="h-10 w-10 rounded-full"
              onClick={() => onRemove(node)}
              disabled={!!isRemoving}
              title="Remove subaccount"
            >
              {isRemoving === node.address ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Delete className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {node.subs && node.subs.length > 0 
        && (node.subs.map((subaccount) => <AccountNode 
          key={subaccount.address} 
          node={subaccount}
          onRemove={onRemove}
          onRename={onRename}
          onQuit={onQuit}
          isRemoving={isRemoving}
        /> ))
      }
    </div>
  );
}

type AccountsTreeProps = {
  accountTree: {
    data?: AccountTreeNode;
    loading: boolean;
  },
  currentAddress: SS58String;
  api: TypedApi<ChainDescriptorOf<ChainId>>;
  openTxDialog: (args: OpenTxDialogArgs_modeSet) => void;
  className?: string;
};

export function AccountsTree({
  accountTree: {data: accountTreeData, loading},
  currentAddress,
  api,
  openTxDialog,
  className = "",
}: AccountsTreeProps) {
  const [newSubaccount, setNewSubaccount] = useState("");
  const [addingSubaccount, setAddingSubaccount] = useState(false);
  const [removingSubaccount, setRemovingSubaccount] = useState<SS58String | null>(null);

  const findAccountNode = (address: SS58String) => {
    if (!accountTreeData) return null;
    const findNode = (node: AccountTreeNode, visited = new Set()): AccountTreeNode | null => {
      if (node.address === address) return node;
      if (node.subs) {
        for (const sub of node.subs) {
          const found = findNode(sub);
          if (found) return found;
        }
      }
      return null;
    };

    return findNode(accountTreeData);
  }

  // Find the current account node and check if it's a subaccount
  const { isSubaccount, currentAccountNode } = useMemo(() => {
    if (!accountTreeData) return { isSubaccount: false, currentAccountNode: null };
    
    // Helper function to find the node with isCurrentAccount flag
    const findCurrentAccountNode = (node: AccountTreeNode): AccountTreeNode | null => {
      if (node.isCurrentAccount) return node;
      
      if (node.subs) {
        for (const sub of node.subs) {
          const found = findCurrentAccountNode(sub);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    const currentNode = findCurrentAccountNode(accountTreeData);
    return { 
      isSubaccount: !!(currentNode?.super),
      currentAccountNode: currentNode
    };
  }, [accountTreeData]);

  const prepareAccountModTx = async ({ subs, address, mode }: ({
    subs: ReturnType<typeof prepareRawSetSubs>,
    mode: DialogMode,
    address: SS58String
  })) => {
    if (!api) throw new Error("API not available");
    if (!currentAddress) throw new Error("Current address not available");

    try {
      setRemovingSubaccount(address);

      const tx = api.tx.Identity.set_subs({ subs });
      const fees = await tx.getEstimatedFees(currentAddress, { at: "best" });

      openTxDialog({ mode, tx, estimatedCosts: { fees }});
    } catch (error) {
      console.error("Error removing subaccount:", error);
    } finally {
      setRemovingSubaccount(null);
    }
  }

  // Prepare transaction to add a subaccount
  const addSubaccount = async (address: SS58String, name: string) => prepareAccountModTx({
    subs: [...prepareRawSetSubs(currentAccountNode), [address, { 
      type: `Raw${name.length}`, 
      value: Binary.fromText(name) 
    }]],
    address,
    mode: "addSubaccount"
  });

  const removeSubAccount = async (node: AccountTreeNode) => prepareAccountModTx({
    subs: prepareRawSetSubs(currentAccountNode).filter(sub => sub[0] !== node.address),
    address: node.address,
    mode: "removeSubaccount"
  });

  const editSubAccount = async (node: AccountTreeNode) => prepareAccountModTx({
    subs: prepareRawSetSubs(currentAccountNode).map(sub => {
      if (sub[0] === node.address) {
        return [node.address, { 
          type: `Raw${node.name.length}`, 
          value: Binary.fromText(node.name) 
        }];
      }
      return sub;
    }),
    address: node.address,
    mode: "editSubAccount"
  });

  // Prepare transaction to remove a subaccount
  const quitSubaccount = async () => {
    if (!api || !currentAddress) return;
    
    try {
      setRemovingSubaccount(currentAddress);
      
      const tx = api.tx.Identity.quit_sub(undefined);
      const fees = await tx.getEstimatedFees(currentAddress, { at: "best" });
      
      openTxDialog({
        mode: "quitSub",
        tx,
        estimatedCosts: { fees }
      });
    } catch (error) {
      console.error("Error removing subaccount:", error);
    } finally {
      setRemovingSubaccount(null);
    }
  };

  const walletAccounts = useAccounts()
    .filter(account => account.address !== currentAddress && !findAccountNode(account.address));
  const [selectedAddress, setSelectedAddress] = useState<SS58String | null>(null);

  const [newName, setNewName] = useState<string | null>(null);
  const [newNameError, setNewNameError] = useState<string | null>(null);

  useEffect(() => {
    console.log({ selectedAddress});
  }, [selectedAddress]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <LoadingPlaceholder className="h-[50vh] w-full" />
        <LoadingPlaceholder className="h-[20vh] w-full" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 border-[#E6007A] border-1 ${className}`}>
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle className="text-inherit flex items-center gap-2">
            <ListTree className="h-5 w-5" />
            Account Hierarchy
          </CardTitle>
          <CardDescription>
            View the relationship between main accounts and subaccounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!accountTreeData ? (
            <div className="text-center py-6 text-muted-foreground">
              No account hierarchy information available
            </div>
          ) : (
            <div className="account-tree">
              <AccountNode 
                node={accountTreeData} 
                isRoot 
                onRemove={removeSubAccount}
                onRename={editSubAccount}
                onQuit={quitSubaccount}
                isRemoving={removingSubaccount}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {currentAccountNode && (
        <Card className="bg-transparent border-[#E6007A]">
          <CardHeader>
            <CardTitle>Add Subaccount</CardTitle>
            <CardDescription>
              Link another account as a subaccount of <span className="text-foreground">
                {currentAccountNode.name || currentAccountNode.address}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="subaccount" className="sr-only">Subaccount Address</Label>
                <AccountSelector
                  id="subaccount"
                  accounts={walletAccounts}
                  address={selectedAddress}
                  handleAddressChange={setSelectedAddress}
                  disabled={addingSubaccount}
                />
              </div>
              <div className="flex-1 flex-col">
                <Label htmlFor="nsme" className="sr-only">Subaccount Address</Label>
                <Input
                  id="nsme"
                  value={newName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewName(value);
                    setNewNameError(() => {
                      if (value.length > 0 && value.length < 4) {
                        return "Name must be at least 4 characters";
                      }
                      if (value.length > 20) {
                        return "Name must be at most 20 characters";
                      }
                      return null;
                    });
                  }}
                  disabled={addingSubaccount}
                />
                {newNameError && (
                  <p className="text-red-500 text-sm mt-1">
                    {newNameError}
                  </p>
                )}
              </div>
              <Button variant="primary"
                onClick={() => addSubaccount(selectedAddress!, newName)} 
                disabled={!selectedAddress || addingSubaccount}
                className="gap-2"
              >
                {addingSubaccount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                Add Subaccount
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

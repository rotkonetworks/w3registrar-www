import { Delete, ListTree, Loader2, PlusCircle, Unlink, } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { TypedApi, SS58String } from "polkadot-api";
import { ChainId } from "@reactive-dot/core";
import { ChainDescriptorOf } from "@reactive-dot/core/internal.js";
import { LoadingPlaceholder } from "~/pages/Loading";
import { AccountTreeNode } from "~/hooks/UseAccountsTree";
import { OpenTxDialogArgs_modeSet } from "~/types";
import { Badge } from "./ui/badge";

type AccountNodeProps = {
  node: AccountTreeNode;
  isRoot?: boolean;
  onRemove: (node: AccountTreeNode) => void;
  onQuit: (subNode: AccountTreeNode) => void;
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
  isRemoving,
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
  accountTree: {data, loading},
  currentAddress,
  api,
  openTxDialog,
  className = "",
}: AccountsTreeProps) {
  const [newSubaccount, setNewSubaccount] = useState("");
  const [addingSubaccount, setAddingSubaccount] = useState(false);
  const [removingSubaccount, setRemovingSubaccount] = useState<SS58String | null>(null);

  // Find the current account node and check if it's a subaccount
  const { isSubaccount, currentAccountNode } = useMemo(() => {
    if (!data) return { isSubaccount: false, currentAccountNode: null };
    
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
    
    const currentNode = findCurrentAccountNode(data);
    return { 
      isSubaccount: !!(currentNode?.super),
      currentAccountNode: currentNode
    };
  }, [data]);

  // Prepare transaction to add a subaccount
  const addSubaccount = async () => {
    if (!api || !newSubaccount.trim()) return;
    
    try {
      setAddingSubaccount(true);
      
      // Validate the address - this is a simple check, might need more validation
      if (!newSubaccount.startsWith("5")) {
        throw new Error("Invalid address format");
      }
      
      const tx = api.tx.Identity.addSub(newSubaccount as SS58String, { Raw: newSubaccount });
      const fees = await tx.getEstimatedFees(currentAddress, { at: "best" });
      
      openTxDialog({
        mode: "addSubaccount",
        tx,
        estimatedCosts: { fees }
      });
      
      setNewSubaccount("");
    } catch (error) {
      console.error("Error adding subaccount:", error);
    } finally {
      setAddingSubaccount(false);
    }
  };

  // Prepare transaction to remove a subaccount
  const removeSubaccount = async (parentAddress: SS58String) => {
    if (!api || !currentAddress) return;
    
    try {
      setRemovingSubaccount(currentAddress);
      
      const tx = api.tx.Identity.quitSub();
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

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <LoadingPlaceholder className="h-[100px] w-full" />
        <LoadingPlaceholder className="h-[60px] w-full" />
        <LoadingPlaceholder className="h-[60px] w-3/4" />
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
          {!data ? (
            <div className="text-center py-6 text-muted-foreground">
              No account hierarchy information available
            </div>
          ) : (
            <div className="account-tree">
              <AccountNode 
                node={data} 
                isRoot 
                onRemove={removeSubaccount}
                isRemoving={removingSubaccount}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {!isSubaccount && (
        <Card className="bg-transparent border-[#E6007A]">
          <CardHeader>
            <CardTitle>Add Subaccount</CardTitle>
            <CardDescription>
              Link another account as a subaccount of your current identity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="subaccount" className="sr-only">Subaccount Address</Label>
                <Input
                  id="subaccount"
                  placeholder="Subaccount address (SS58 format)"
                  value={newSubaccount}
                  onChange={(e) => setNewSubaccount(e.target.value)}
                  disabled={addingSubaccount}
                />
              </div>
              <Button 
                onClick={addSubaccount} 
                disabled={!newSubaccount.trim() || addingSubaccount}
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

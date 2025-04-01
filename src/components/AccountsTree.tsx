import { Loader2, PlusCircle, XCircle } from "lucide-react";
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

type AccountNodeProps = {
  node: AccountTreeNode;
  isRoot?: boolean;
  onRemove?: (address: SS58String) => void;
  isRemoving?: SS58String | null;
};

function AccountNode({
  node,
  isRoot = false,
  onRemove,
  isRemoving,
}: AccountNodeProps) {
  return (
    <div className={`relative ${isRoot ? 'mb-4' : 'ml-6 mt-2 pt-2 pl-4 border-l-2 border-primary/40'}`}>
      <div className={`p-3 rounded-lg flex items-center justify-between ${
        node.isCurrentAccount ? 'bg-primary/20 border border-primary' : 'bg-card'
      }`}>
        <div>
          <div className="font-semibold truncate max-w-[200px] sm:max-w-[300px]">
            {node.name || node.address.slice(0, 8) + '...' + node.address.slice(-6)}
            {node.isCurrentAccount && <span className="ml-2 text-xs text-primary">(Current)</span>}
          </div>
          <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
            {node.address}
          </div>
        </div>
        {!isRoot && node.isCurrentAccount && onRemove && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full"
            onClick={() => onRemove(node.super?.address as SS58String)}
            disabled={!!isRemoving}
          >
            {isRemoving === node.address ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </Button>
        )}
        {isRoot && onRemove && node.subs?.some(sub => sub.isCurrentAccount) && (
          <div className="text-xs text-muted-foreground">
            (Contains current account as subaccount)
          </div>
        )}
      </div>
      
      {node.subs && node.subs.length > 0 && (
        <div className="mt-2">
          {node.subs.map((subaccount) => (
            <AccountNode 
              key={subaccount.address} 
              node={subaccount}
              onRemove={onRemove}
              isRemoving={isRemoving}
            />
          ))}
        </div>
      )}
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
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Account Hierarchy</CardTitle>
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
                onRemove={isSubaccount ? removeSubaccount : undefined}
                isRemoving={removingSubaccount}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {!isSubaccount && (
        <Card>
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

import { DialogTitle } from "@radix-ui/react-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "../ui/dialog";

export const GenericDialog = ({ open, onOpenChange, description, title, children, footer, ...props }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  props?: Record<string, any>;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-[#2C2B2B] dark:text-[#FFFFFF] border-[#E6007A]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
      {footer && <DialogFooter>{footer}</DialogFooter>}
    </Dialog>
  )
}
import { Button } from "@/components/ui/button";
import { HelpCarousel } from "~/help/helpCarousel";

import { GenericDialog } from "./GenericDialog";

export default function HelpDialog({
  open,
  handleOpenChange,
  setHelpSlideIndex,
  helpSlideIndex,
  SLIDES_COUNT,
  setOpenDialog,
}: {
  open: boolean;
  handleOpenChange: (open: boolean) => void;
  setHelpSlideIndex: (index: number) => void;
  helpSlideIndex: number;
  SLIDES_COUNT: number;
  setOpenDialog: (dialog: string | null) => void;
}) {
  return (
    <GenericDialog open={open} onOpenChange={(v) => {
      handleOpenChange(v);
      setHelpSlideIndex(0);
    }}
      title="Quick start guide"
      footer={<>
        {helpSlideIndex < SLIDES_COUNT - 1 && (
          <Button variant="outline" onClick={() => {
            setOpenDialog(null);
            setHelpSlideIndex(0);
          }}>Skip</Button>
        )}
        <Button
          onClick={() => {
            if (helpSlideIndex === SLIDES_COUNT - 1) {
              setOpenDialog(null);
              setHelpSlideIndex(0);
            } else {
              setHelpSlideIndex(prev => prev + 1);
            }
          }}
        >
          {helpSlideIndex >= SLIDES_COUNT - 1 ? "Close" : "Next"}
        </Button>
      </>}
    >
      <HelpCarousel currentSlideIndex={helpSlideIndex} onSlideIndexChange={setHelpSlideIndex} />
    </GenericDialog>
  );
}

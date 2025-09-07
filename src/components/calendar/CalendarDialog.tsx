import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CalendarModal from "../calendar/CalendarModal";

interface CalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refreshKey?: number;
}

export default function CalendarDialog({ open, onOpenChange, refreshKey }: CalendarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80vw] w-[80vw] h-[80vh] !max-w-[80vw] !w-[80vw] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle>My Google Calendar</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <CalendarModal key={refreshKey} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

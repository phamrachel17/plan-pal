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
      <DialogContent className="max-w-7xl h-[90vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle>My Google Calendar</DialogTitle>
        </DialogHeader>
        <CalendarModal key={refreshKey} />
      </DialogContent>
    </Dialog>
  );
}

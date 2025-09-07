import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";

interface ChatHeaderProps {
  onQuickAdd: () => void;
  onShowCalendar: () => void;
}

export default function ChatHeader({ onQuickAdd, onShowCalendar }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
      <h2 className="text-lg font-semibold text-gray-800">AI Assistant</h2>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onQuickAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Quick Add
        </Button>
        <Button variant="outline" size="sm" onClick={onShowCalendar} className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          View Calendar
        </Button>
      </div>
    </div>
  );
}

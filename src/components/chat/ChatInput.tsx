import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
}

export default function ChatInput({ value, onChange, onSend, onKeyPress, disabled }: ChatInputProps) {
  return (
    <div className="p-4 border-t bg-gray-50 rounded-b-lg">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Type your message here... (e.g., 'Dinner with Rachel at 7 PM tomorrow')"
          disabled={disabled}
          className="flex-1"
        />
        <Button onClick={onSend} disabled={!value.trim() || disabled} className="px-4">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

import { EyeOff, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onLayoutClick: () => void;
  onToggleTopBar: () => void;
}

export function TopBar({ onLayoutClick, onToggleTopBar }: TopBarProps) {
  return (
    <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Hide Top Bar Button */}
        <Button variant="ghost" size="sm" onClick={onToggleTopBar}>
          <EyeOff className="w-4 h-4" />
        </Button>

        {/* Dashboard Layout Button */}
        <Button variant="ghost" size="sm" onClick={onLayoutClick}>
          <Layout className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

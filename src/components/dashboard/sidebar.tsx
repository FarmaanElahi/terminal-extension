import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useDashboard } from "./context";
import { WidgetLibrary } from "./widget_library";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LayoutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LayoutSidebar({ isOpen, onClose }: LayoutSidebarProps) {
  const { layouts, currentLayout, setCurrentLayout, createLayout } =
    useDashboard();
  const [isCreating, setIsCreating] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");

  const handleCreateLayout = () => {
    if (newLayoutName.trim()) {
      createLayout(newLayoutName.trim());
      setNewLayoutName("");
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateLayout();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent side="right" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle>Dashboard Layout</SheetTitle>
            <SheetDescription>
              Manage your dashboard layouts and add widgets
            </SheetDescription>
          </SheetHeader>

          {/* Layout Selection */}
          <div className="p-4 border-b border-border">
            <div className="space-y-3">
              {/* Layout Dropdown or Create Input */}
              {isCreating ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Layout name"
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    onClick={handleCreateLayout}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={currentLayout}
                    onValueChange={setCurrentLayout}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a layout" />
                    </SelectTrigger>
                    <SelectContent>
                      {layouts.map((layout) => (
                        <SelectItem key={layout.id} value={layout.id}>
                          {layout.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setIsCreating(true)}
                    variant="default"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Layout
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Widget Library */}
          <div className="flex-1 overflow-y-auto">
            <WidgetLibrary />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

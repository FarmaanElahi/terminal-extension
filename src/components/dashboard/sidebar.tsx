import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useDashboard } from "./context";
import { WidgetLibrary } from "./widget_library";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-foreground font-semibold">Dashboard Layout</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Layout Selection */}
          <div className="p-4 border-b border-border">
            <div className="space-y-3">
              {/* Layout Dropdown or Create Input */}
              {isCreating ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    placeholder="Layout name"
                    className="flex-1 bg-input text-foreground px-3 py-2 rounded-md border border-border focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateLayout}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={currentLayout}
                    onChange={(e) => setCurrentLayout(e.target.value)}
                    className="w-full bg-input text-foreground px-3 py-2 rounded-md border border-border focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {layouts.map((layout) => (
                      <option key={layout.id} value={layout.id}>
                        {layout.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md w-full justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Layout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Widget Library */}
          <div className="flex-1 overflow-y-auto">
            <WidgetLibrary />
          </div>
        </div>
      </div>
    </div>
  );
}

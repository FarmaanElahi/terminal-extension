import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface LayoutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LayoutSidebar({ isOpen, onClose }: LayoutSidebarProps) {
  const {
    screens,
    currentScreenId,
    setCurrentScreenId,
    createScreen,
    deleteScreen,
    isLoading,
    error,
  } = useDashboard();

  const [isCreating, setIsCreating] = useState(false);
  const [newScreenName, setNewScreenName] = useState("");

  const handleCreateScreen = () => {
    if (newScreenName.trim()) {
      createScreen(newScreenName.trim());
      setNewScreenName("");
      setIsCreating(false);
    }
  };

  const handleDeleteScreen = (screenId: string) => {
    deleteScreen(screenId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateScreen();
    }
    if (e.key === "Escape") {
      setIsCreating(false);
      setNewScreenName("");
    }
  };

  const currentScreen = screens.find((s) => s.id === currentScreenId);
  const canDelete = screens.length > 1;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle>Dashboard Layout</SheetTitle>
            <SheetDescription>
              Manage your dashboard layouts and add widgets
            </SheetDescription>
            {error && (
              <div className="text-red-500 text-sm mt-2">
                Error: {error.message}
              </div>
            )}
          </SheetHeader>

          {/* Layout Selection */}
          <div className="p-4 border-b border-border">
            <div className="space-y-3">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Loading layouts...
                  </span>
                </div>
              )}

              {/* Layout Dropdown or Create Input */}
              {!isLoading && (
                <>
                  {isCreating ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={newScreenName}
                        onChange={(e) => setNewScreenName(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Layout name"
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        onClick={handleCreateScreen}
                        size="sm"
                        disabled={!newScreenName.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Select
                          value={currentScreenId || ""}
                          onValueChange={setCurrentScreenId}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a layout" />
                          </SelectTrigger>
                          <SelectContent>
                            {screens.map((screen) => (
                              <SelectItem key={screen.id} value={screen.id}>
                                {screen.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Delete Button */}
                        {currentScreen && canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Layout
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "
                                  {currentScreen.name}"? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteScreen(currentScreen.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

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
                </>
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

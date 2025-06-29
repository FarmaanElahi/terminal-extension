import { useState } from "react";
import { TopBar } from "./top_bar";
import { LayoutSidebar } from "./sidebar";
import { DashboardContent } from "./content";
import { DashboardProvider } from "./context";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState(
    localStorage.getItem("TERM:TOP_BAR_VISIBLE") === "true",
  );
  const toggleTopBarVisibility = () => {
    localStorage.setItem("TERM:TOP_BAR_VISIBLE", (!isTopBarVisible).toString());
    setIsTopBarVisible(!isTopBarVisible);
  };

  return (
    <DashboardProvider>
      <div className="h-screen w-full flex flex-col bg-background">
        {/* Top Bar with smooth transition */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isTopBarVisible ? "h-auto opacity-100" : "h-0 opacity-0"
          }`}
        >
          <TopBar
            onLayoutClick={() => setIsSidebarOpen(true)}
            onToggleTopBar={toggleTopBarVisibility}
          />
        </div>

        {/* Floating Expand Button - only show when top bar is hidden */}
        {!isTopBarVisible && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsTopBarVisible(true)}
            className="fixed top-4 right-4 z-40 shadow-lg hover:shadow-xl transition-shadow"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        )}

        {/* Main Content Area */}
        <div className="flex-1 relative">
          <DashboardContent />

          {/* Floating Layout Sidebar */}
          <LayoutSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>
    </DashboardProvider>
  );
}

import { useState } from "react";
import { TopBar } from "./top_bar";
import { LayoutSidebar } from "./sidebar";
import { DashboardContent } from "./content";
import { DashboardProvider } from "./context";

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <DashboardProvider>
      <div className="h-screen w-full flex flex-col bg-background">
        {/* Persistent Top Bar */}
        <TopBar onLayoutClick={() => setIsSidebarOpen(true)} />

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

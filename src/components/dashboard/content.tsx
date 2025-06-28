import { useEffect, useState } from "react";
import { Layout, Responsive, WidthProvider } from "react-grid-layout";
import { useDashboard } from "./context";
import { WidgetRenderer } from "./widget_renderer";
import { LayoutItem } from "./types";
import { WIDGET_SIZES, widgets } from "./widget_registry";
import { Loader2 } from "lucide-react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

export function DashboardContent() {
  const {
    getCurrentLayoutData,
    updateLayoutData,
    addWidget,
    isLoading,
    error,
  } = useDashboard();

  const [mounted, setMounted] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");

  const layoutData = getCurrentLayoutData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLayoutChange = (
    layout: Layout[],
    layouts: { [key: string]: Layout[] },
  ) => {
    // Only update if we have widgets to update
    if (layoutData.layout.length === 0) return;

    // Use the layout for the current breakpoint
    const currentLayout = layouts[currentBreakpoint] || layout;

    // Merge the new layout positions with existing LayoutItems
    const updatedLayout: LayoutItem[] = layoutData.layout.map((item) => {
      const layoutUpdate = currentLayout.find((l) => l.i === item.i);
      if (layoutUpdate) {
        return {
          ...item,
          ...layoutUpdate,
        };
      }
      return item;
    });

    updateLayoutData(updatedLayout);
  };

  const handleBreakpointChange = (breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
  };

  const handleDrop = (layout: Layout[], layoutItem: Layout, _event: Event) => {
    console.log("Drop detected:", { layout, layoutItem, _event });

    const dragEvent = _event as DragEvent;
    const widgetData = dragEvent.dataTransfer?.getData("application/json");
    _event.preventDefault();

    console.log("Widget data from drag:", widgetData);

    if (widgetData) {
      try {
        const widget: (typeof widgets)[0] = JSON.parse(widgetData);
        console.log("Adding widget:", widget, "at position:", layoutItem);
        addWidget(widget, layoutItem);
      } catch (error) {
        console.error("Failed to parse widget data:", error);
      }
    } else {
      console.warn("No widget data found in drag event");
    }
  };

  if (error) {
    return (
      <div className="h-full w-full p-4 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg mb-2">
            Error loading dashboard
          </p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full w-full p-4 bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background relative">
      {currentBreakpoint}
      {/* Always render ResponsiveGridLayout for drag and drop */}
      <ResponsiveGridLayout
        className="layout h-full overflow-auto"
        style={{ height: "100%" }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 9, sm: 6, xs: 3, xxs: 3 }}
        rowHeight={75}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        onDrop={handleDrop}
        isDroppable={true}
        allowOverlap={false}
        onDropDragOver={() => ({ w: 6, h: 6 })}
        useCSSTransforms={mounted}
        measureBeforeMount={false}
        preventCollision={false}
        draggableHandle=".drag-handle"
        resizeHandles={["sw", "nw", "se", "ne"]}
      >
        {layoutData.layout.map((item) => {
          const { minW, minH } = WIDGET_SIZES[item.type] ?? {};
          return (
            <div
              key={item.i}
              data-grid={{ ...item, minW, minH }}
              className="bg-card border border-border rounded-lg overflow-hidden  select-none"
            >
              <WidgetRenderer layoutItem={item} />
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}

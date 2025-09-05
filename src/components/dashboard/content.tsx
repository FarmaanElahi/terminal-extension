import { useEffect, useMemo, useState } from "react";
import { Layout, Responsive, WidthProvider } from "react-grid-layout";
import { useDashboard } from "./context";
import { WidgetRenderer } from "./widget_renderer";
import { LayoutItem } from "./types";
import { widgets } from "./widget_registry";
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
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<keyof typeof breakpoints>("lg");

  const layoutData = getCurrentLayoutData();

  // Bootstrap-style responsive breakpoints and column configuration
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate bootstrap-style responsive layouts
  const responsiveLayout = useMemo(() => {
    if (!layoutData.layout.length)
      return {} as Record<keyof typeof breakpoints, LayoutItem[]>;

    // Bootstrap-style widths for different breakpoints
    const bootstrapWidths = {
      lg: 4, // 6 columns (12/2)
      md: 4, // 4 columns (12/3)
      sm: 4, // 3 columns (12/4)
      xs: 6, // 2 column (12/6)
      xxs: 12, // 1 column (12/12)
    };

    return Object.keys(breakpoints).reduce(
      (layouts, breakpoint) => {
        const width =
          bootstrapWidths[breakpoint as keyof typeof bootstrapWidths];
        const colCount = cols[breakpoint as keyof typeof cols];

        layouts[breakpoint as keyof typeof breakpoints] = layoutData.layout.map(
          (item, index) => {
            // Calculate position based on bootstrap-style grid
            const x = (index * width) % colCount;
            const y = Math.floor((index * width) / colCount) * 4; // Stack rows properly

            return {
              ...item,
              i: item.i,
              x,
              y,
              w: width,
              h: item.h || 4,
            };
          },
        );

        return layouts;
      },
      {} as Record<keyof typeof breakpoints, LayoutItem[]>,
    );
  }, [layoutData.layout]);

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
          x: layoutUpdate.x,
          y: layoutUpdate.y,
          w: layoutUpdate.w,
          h: layoutUpdate.h,
        };
      }
      return item;
    });

    updateLayoutData(updatedLayout);
  };

  const handleBreakpointChange = (breakpoint: string) => {
    setCurrentBreakpoint(breakpoint as keyof typeof breakpoints);
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
      <div className="text-xs text-muted-foreground absolute top-2 right-2 z-10">
        Breakpoint: {currentBreakpoint}
      </div>

      <ResponsiveGridLayout
        className="layout h-full overflow-auto"
        style={{ height: "100%" }}
        breakpoints={breakpoints}
        cols={cols}
        layouts={responsiveLayout}
        rowHeight={75}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        onDrop={handleDrop}
        isDroppable={true}
        isDraggable={true}
        isResizable={true}
        allowOverlap={false}
        onDropDragOver={() => ({ w: 6, h: 6 })}
        useCSSTransforms={mounted}
        measureBeforeMount={false}
        preventCollision={false}
        draggableHandle=".drag-handle"
        resizeHandles={["sw", "nw", "se", "ne"]}
        compactType="vertical"
        margin={[10, 10]}
      >
        {responsiveLayout[currentBreakpoint]?.map((item) => {
          return (
            <div
              key={item.i}
              className="bg-card border border-border rounded-lg overflow-hidden select-none shadow-sm hover:shadow-md transition-shadow"
            >
              <WidgetRenderer layoutItem={item} />
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}

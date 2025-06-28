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
  const layoutData = getCurrentLayoutData();
  console.log(layoutData);

  const handleLayoutChange = (layout: Layout[]) => {
    // Merge the new layout positions with existing LayoutItems
    const updatedLayout: LayoutItem[] = layoutData.layout.map((item) => {
      const layoutUpdate = layout.find((l) => l.i === item.i);
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

  // @ts-ignore
  const handleDrop = (layout: Layout[], layoutItem: Layout, _event: Event) => {
    const dragEvent = _event as DragEvent;
    const widgetData = dragEvent.dataTransfer?.getData("application/json");

    if (widgetData) {
      try {
        const widget: (typeof widgets)[0] = JSON.parse(widgetData);
        addWidget(widget, layoutItem);
      } catch (error) {
        console.error("Failed to parse widget data:", error);
      }
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

  // Convert LayoutItems to regular Layout objects for ResponsiveGridLayout
  const gridLayout = layoutData.layout.map(
    ({ type, settings, ...layout }) => layout,
  );

  return (
    <div className="h-full w-full p-4 bg-background">
      {layoutData.layout.length === 0 ? (
        <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg">
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-2">
              No widgets added yet
            </p>
            <p className="text-muted-foreground/70 text-sm">
              Drag widgets from the sidebar to start building your dashboard
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: gridLayout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          onLayoutChange={handleLayoutChange}
          onDrop={handleDrop}
          isDroppable={true}
          useCSSTransforms={true}
          compactType="vertical"
          preventCollision={false}
        >
          {layoutData.layout.map((layoutItem) => (
            <div
              key={layoutItem.i}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              <WidgetRenderer layoutItem={layoutItem} />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}

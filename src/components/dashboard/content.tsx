import React from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { useDashboard } from "./context";
import { WidgetRenderer } from "./widget_renderer";
import { WidgetType } from "./widget_library";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

export function DashboardContent() {
  const { getCurrentLayoutData, updateLayoutData, addWidget } = useDashboard();
  const layoutData = getCurrentLayoutData();

  const handleLayoutChange = (layout: Layout[]) => {
    updateLayoutData(layout);
  };

  // @ts-ignore
  const handleDrop = (layout: Layout[], layoutItem: Layout, _event: Event) => {
    const dragEvent = _event as DragEvent;
    const widgetData = dragEvent.dataTransfer?.getData("application/json");

    if (widgetData) {
      const widget: WidgetType = JSON.parse(widgetData);
      addWidget(widget, layoutItem);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  return (
    <div
      className="h-full w-full p-4 bg-background"
      onDragOver={handleDragOver}
    >
      {layoutData.widgets.length === 0 ? (
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
          layouts={{ lg: layoutData.layout }}
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
          {layoutData.widgets.map((widget) => (
            <div
              key={widget.id}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              <WidgetRenderer widget={widget} />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}

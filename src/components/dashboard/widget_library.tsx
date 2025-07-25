import { useState } from "react";
import { widgets } from "./widget_registry";

export function WidgetLibrary() {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, widget: (typeof widgets)[0]) => {
    // Firefox hack - this is crucial for drag and drop to work
    e.dataTransfer.setData("text/plain", "");
    e.dataTransfer.setData("application/json", JSON.stringify(widget));
    e.dataTransfer.effectAllowed = "copy";
    setDraggedWidget(widget.type);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Widgets</h3>
      <div className="space-y-2">
        {widgets.map((widget) => (
          <div
            key={widget.type}
            draggable={true}
            unselectable="on" // Firefox compatibility
            onDragStart={(e) => handleDragStart(e, widget)}
            onDragEnd={handleDragEnd}
            className={`p-3 bg-card border border-border rounded-lg cursor-grab hover:bg-accent hover:border-accent-foreground/50 transition-colors group ${
              draggedWidget === widget.type ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 bg-primary/60 rounded-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground group-hover:text-accent-foreground transition-colors">
                  {widget.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {widget.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drag Instructions */}
      <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-dashed border-border">
        <p className="text-xs text-muted-foreground text-center">
          💡 Drag widgets to the dashboard area to add them
        </p>
      </div>
    </div>
  );
}

// Re-export the WidgetType for compatibility
export type { WidgetType } from "./widget_registry";

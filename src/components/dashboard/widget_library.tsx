import { WIDGET_SIZES, widgets } from "./widget_registry";

export function WidgetLibrary() {
  const handleDragStart = (e: React.DragEvent, widget: (typeof widgets)[0]) => {
    e.dataTransfer.setData("application/json", JSON.stringify(widget));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Widgets</h3>
      <div className="space-y-2">
        {widgets.map((widget) => (
          <div
            key={widget.type}
            draggable
            onDragStart={(e) => handleDragStart(e, widget)}
            className="p-3 bg-card border border-border rounded-lg cursor-grab hover:bg-accent hover:border-accent-foreground/50 transition-colors group"
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
                <div className="text-xs text-muted-foreground/70 mt-2">
                  Default: {WIDGET_SIZES[widget.type].w}×
                  {WIDGET_SIZES[widget.type].h}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Re-export the WidgetType for compatibility
export type { WidgetType } from "./widget_registry";

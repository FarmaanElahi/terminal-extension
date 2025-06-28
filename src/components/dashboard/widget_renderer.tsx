import { widgetComponents } from "./widget_registry";
import { LayoutItem } from "./types";
import { X } from "lucide-react";
import { useDashboard } from "./context";
import { Button } from "@/components/ui/button";

interface WidgetRendererProps {
  layoutItem: LayoutItem;
}

export function WidgetRenderer({ layoutItem }: WidgetRendererProps) {
  const { removeWidget } = useDashboard();

  const WidgetComponent = widgetComponents[layoutItem.type];

  if (!WidgetComponent) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">
          Unknown widget type: {layoutItem.type}
        </p>
      </div>
    );
  }

  const widgetName =
    layoutItem.type.charAt(0).toUpperCase() + layoutItem.type.slice(1);

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/50">
        <h3 className="text-sm font-medium text-foreground truncate">
          {widgetName}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeWidget(layoutItem.i)}
          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-hidden">
        <WidgetComponent settings={layoutItem.settings} />
      </div>
    </div>
  );
}

import { WidgetProps } from "./widget-props";
import { Database } from "lucide-react";

export function DataPanelApp(_props: WidgetProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-background">
      <Database className="w-12 h-12 text-primary mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">Data Panel</h3>
      <p className="text-sm text-muted-foreground text-center">
        Comprehensive data analysis and visualization
      </p>
      <div className="mt-4 w-full h-24 bg-muted/50 rounded border-2 border-dashed border-border flex items-center justify-center">
        <span className="text-xs text-muted-foreground">
          Data panel placeholder
        </span>
      </div>
    </div>
  );
}

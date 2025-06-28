import { WidgetProps } from "./widget-props";
import { Search } from "lucide-react";

export function ScreenerApp(_props: WidgetProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-background">
      <Search className="w-12 h-12 text-primary mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Stock Screener
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Screen stocks based on various criteria and filters
      </p>
      <div className="mt-4 w-full h-32 bg-muted/50 rounded border-2 border-dashed border-border flex items-center justify-center">
        <span className="text-xs text-muted-foreground">
          Screener results placeholder
        </span>
      </div>
    </div>
  );
}

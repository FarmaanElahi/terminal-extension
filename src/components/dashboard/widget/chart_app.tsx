import { TrendingUp } from "lucide-react";

export function ChartApp() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-background">
      <TrendingUp className="w-12 h-12 text-primary mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Chart Widget
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Advanced charting capabilities for technical analysis
      </p>
      <div className="mt-4 w-full h-24 bg-muted/50 rounded border-2 border-dashed border-border flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Chart placeholder</span>
      </div>
    </div>
  );
}

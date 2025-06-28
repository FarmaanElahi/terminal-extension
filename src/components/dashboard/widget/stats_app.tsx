import { WidgetProps } from "./widget-props";
import { BarChart3 } from "lucide-react";

export function StatsApp(_props: WidgetProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-background">
      <BarChart3 className="w-12 h-12 text-primary mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">Statistics</h3>
      <p className="text-sm text-muted-foreground text-center">
        View detailed market statistics and metrics
      </p>
      <div className="mt-4 w-full grid grid-cols-2 gap-2">
        {["Gainers", "Losers", "Volume", "Activity"].map((stat, i) => (
          <div
            key={i}
            className="h-8 bg-muted/50 rounded border border-border flex items-center justify-center"
          >
            <span className="text-xs text-muted-foreground">{stat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

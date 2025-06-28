import { WidgetProps } from "./widget-props";
import { Lightbulb } from "lucide-react";

export function IdeasApp(_props: WidgetProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-background">
      <Lightbulb className="w-12 h-12 text-primary mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Trading Ideas
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Get trading ideas and market insights
      </p>
      <div className="mt-4 w-full space-y-2">
        {["Bullish Setup", "Market Trend", "Risk Alert"].map((idea, i) => (
          <div
            key={i}
            className="h-6 bg-muted/50 rounded border border-border flex items-center px-2"
          >
            <span className="text-xs text-muted-foreground">{idea}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

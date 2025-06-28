import { WidgetProps } from "./widget-props";
import { Eye } from "lucide-react";

export function WatchlistApp({ settings }: WidgetProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-background">
      <Eye className="w-12 h-12 text-primary mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">Watchlist</h3>
      <p className="text-sm text-muted-foreground text-center">
        Track and monitor your favorite stocks
      </p>
      <div className="mt-4 w-full space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 bg-muted/50 rounded border border-border flex items-center px-3"
          >
            <span className="text-xs text-muted-foreground">
              Stock {i} placeholder
            </span>
          </div>
        ))}
      </div>
      {settings && Object.keys(settings).length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Settings: {JSON.stringify(settings)}
        </div>
      )}
    </div>
  );
}

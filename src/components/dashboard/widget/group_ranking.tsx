import { WidgetProps } from "./widget-props";
import { Trophy } from "lucide-react";

export function GroupRankingApp(_props: WidgetProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-background">
      <Trophy className="w-12 h-12 text-primary mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Group Ranking
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Track and compare group performance rankings
      </p>
      <div className="mt-4 w-full space-y-1">
        {[1, 2, 3, 4].map((rank) => (
          <div
            key={rank}
            className="h-6 bg-muted/50 rounded border border-border flex items-center px-2"
          >
            <span className="text-xs font-mono text-muted-foreground">
              #{rank}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              Group {rank}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

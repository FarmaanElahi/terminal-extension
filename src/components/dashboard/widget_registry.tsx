import { ComponentType } from "react";
import { WidgetProps } from "./widget/widget-props.ts";
import { ScreenerApp } from "./widget/screener.tsx";
import { WatchlistApp } from "./widget/watchlist_app.tsx";
import { StatsApp } from "./widget/stats_app.tsx";
import { IdeasApp } from "./widget/idea_app.tsx";
import { ChartApp } from "./widget/chart_app.tsx";
import { DataPanelApp } from "./widget/data_panel.tsx";
import { GroupRankingApp } from "./widget/group_ranking.tsx";

export type WidgetType =
  | "screener"
  | "watchlist"
  | "stats"
  | "ideas"
  | "chart"
  | "panel"
  | "group_ranking";

export const widgetComponents: Record<
  WidgetType,
  ComponentType<WidgetProps>
> = {
  screener: ScreenerApp,
  watchlist: WatchlistApp,
  stats: StatsApp,
  ideas: IdeasApp,
  chart: ChartApp,
  panel: DataPanelApp,
  group_ranking: GroupRankingApp,
};

export const widgets: Array<{
  type: WidgetType;
  name: string;
  description: string;
}> = [
  {
    type: "screener",
    name: "Stock Screener",
    description: "Screen stocks based on various criteria",
  },
  {
    type: "watchlist",
    name: "Watchlist",
    description: "Track your favorite stocks",
  },
  {
    type: "stats",
    name: "Statistics",
    description: "View detailed statistics",
  },
  {
    type: "ideas",
    name: "Trading Ideas",
    description: "Get trading ideas and insights",
  },
  {
    type: "chart",
    name: "Chart",
    description: "Chart Widget",
  },
  {
    type: "panel",
    name: "Data Panel",
    description: "Data Panel",
  },
  {
    type: "group_ranking",
    name: "Group Ranking",
    description: "Track group easily",
  },
];

export const WIDGET_SIZES: Record<
  WidgetType,
  { w: number; h: number; minW: number; minH: number }
> = {
  chart: { w: 6, h: 4, minW: 1, minH: 1 },
  group_ranking: { w: 6, h: 4, minW: 1, minH: 1 },
  watchlist: { w: 6, h: 4, minW: 1, minH: 1 },
  screener: { w: 6, h: 4, minW: 1, minH: 1 },
  stats: { w: 6, h: 2, minW: 1, minH: 1 },
  ideas: { w: 6, h: 4, minW: 1, minH: 1 },
  panel: { w: 6, h: 4, minW: 1, minH: 1 },
};

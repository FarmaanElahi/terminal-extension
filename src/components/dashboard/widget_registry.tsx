import { ComponentType } from "react";
import { WidgetProps } from "./widget/widget-props.ts";
import { ScreenerApp } from "./widget/screener.tsx";
import { WatchlistApp } from "./widget/watchlist_app.tsx";
import { StatsApp } from "./widget/stats_app.tsx";
import { IdeasApp } from "./widget/idea_app.tsx";
import { ChartApp } from "./widget/chart_app.tsx";
import { DataPanelApp } from "./widget/data_panel.tsx";
import { GroupRankingApp } from "./widget/group_ranking.tsx";
import { MSIndiaApp } from "@/components/dashboard/widget/ms_india_app.tsx";

export type WidgetType =
  | "screener"
  | "watchlist"
  | "stats"
  | "ideas"
  | "chart"
  | "panel"
  | "group_ranking"
  | "market_smith_india";

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
  market_smith_india: MSIndiaApp,
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
  {
    type: "market_smith_india",
    name: "MS India",
    description: "Track CANSLIM for India Stock",
  },
];

export const WIDGET_SIZES: Record<
  WidgetType,
  { w: number; h: number; minW: number; minH: number }
> = {
  chart: { w: 3, h: 4, minW: 2, minH: 2 },
  group_ranking: { w: 3, h: 4, minW: 2, minH: 2 },
  watchlist: { w: 3, h: 4, minW: 2, minH: 2 },
  screener: { w: 3, h: 4, minW: 2, minH: 2 },
  stats: { w: 4, h: 2, minW: 2, minH: 2 },
  ideas: { w: 3, h: 4, minW: 2, minH: 2 },
  panel: { w: 3, h: 4, minW: 2, minH: 2 },
  market_smith_india: { w: 3, h: 4, minW: 2, minH: 2 },
};

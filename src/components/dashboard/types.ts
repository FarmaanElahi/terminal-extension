import { Layout } from "react-grid-layout";
import { WidgetType } from "./widget_registry.tsx";

export type WidgetSettings = Record<string, unknown>;

export interface LayoutItem extends Layout {
  type: WidgetType;
  settings?: WidgetSettings;
}

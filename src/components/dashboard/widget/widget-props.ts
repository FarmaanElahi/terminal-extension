import { LayoutItem, WidgetSettings } from "../types";

export interface WidgetProps {
  layout: LayoutItem;
  updateSettings: (settings: WidgetSettings) => void;
}

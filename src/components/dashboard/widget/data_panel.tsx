import { DataPanel } from "@/components/data-panel/data-panel";
import { WidgetProps } from "./widget-props";
import { DataPanelProvider } from "@/hooks/use-active-data-panel.tsx";
import { useCallback } from "react";
import { DataPanelSelector } from "@/components/data-panel/data-panel-selector.tsx";

export function DataPanelApp({ layout, updateSettings }: WidgetProps) {
  const defaultActiveDataPanelId = layout?.settings?.activeDataPanelId as
    | string
    | undefined;

  const dataPanelChanged = useCallback(
    (dataPanelId: string | null) => {
      updateSettings({ ...layout?.settings, activeDataPanelId: dataPanelId });
    },
    [updateSettings, layout],
  );

  return (
    <DataPanelProvider
      defaultActiveDataPanelId={defaultActiveDataPanelId}
      onActiveDataPanelIdChange={dataPanelChanged}
    >
      <div className={"h-full flex flex-col overflow-hidden"}>
        <DataPanelSelector />
        <DataPanel className="flex-1" />
      </div>
    </DataPanelProvider>
  );
}

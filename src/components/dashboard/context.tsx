import { createContext, ReactNode, useContext, useState } from "react";
import { Layout } from "react-grid-layout";
import { WIDGET_SIZES, widgets, WidgetType } from "./widget_registry";
import { LayoutItem } from "./types";
import {
  useCreateDashboard,
  useDashboards,
  useDeleteDashboard,
  useUpdatedDashboard,
} from "@/lib/api";
import type { Dashboard, Json } from "@/types/supabase";

interface DashboardLayout {
  id: string;
  name: string;
  layout: LayoutItem[];
}

interface DashboardContextType {
  dashboards: Dashboard[];
  currentDashboardId: string | null;
  setCurrentDashboardId: (dashboardId: string) => void;
  createDashboard: (name: string) => void;
  deleteDashboard: (dashboardId: string) => void;
  getCurrentLayoutData: () => DashboardLayout;
  updateLayoutData: (layout: LayoutItem[]) => void;
  addWidget: (
    widget: (typeof widgets)[0],
    layoutItem?: Partial<Layout>,
  ) => void;
  removeWidget: (widgetId: string) => void;
  isLoading: boolean;
  error: Error | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(
    null,
  );

  // API hooks
  const { data: dashboards = [], isLoading, error } = useDashboards();
  const createDashboardMutation = useCreateDashboard((dashboard) => {
    setCurrentDashboardId(dashboard.id);
  });
  const updateDashboardMutation = useUpdatedDashboard();
  const deleteDashboardMutation = useDeleteDashboard();

  const createDashboard = (name: string) => {
    const newDashboard = {
      name,
      description: `Dashboard layout: ${name}`,
      layout: [],
      widgets: [], // This field might be removed since layout contains all info
    };
    createDashboardMutation.mutate(newDashboard);
  };

  const deleteDashboard = (dashboardId: string) => {
    deleteDashboardMutation.mutate(dashboardId, {
      onSuccess: () => {
        // If we deleted the current dashboard, switch to another one
        if (currentDashboardId === dashboardId && dashboards.length > 1) {
          const remainingDashboards = dashboards.filter(
            (d) => d.id !== dashboardId,
          );
          if (remainingDashboards.length > 0) {
            setCurrentDashboardId(remainingDashboards[0].id);
          } else {
            setCurrentDashboardId(null);
          }
        }
      },
    });
  };

  const getCurrentLayoutData = (): DashboardLayout => {
    const currentDashboard = dashboards.find(
      (dashboard) => dashboard.id === currentDashboardId,
    );

    if (!currentDashboard) {
      return {
        id: "default",
        name: "Default Layout",
        layout: [],
      };
    }

    // Parse the stored layout from the dashboard data
    const layout = Array.isArray(currentDashboard.layout)
      ? (currentDashboard.layout as unknown as LayoutItem[])
      : [];

    return {
      id: currentDashboard.id,
      name: currentDashboard.name,
      layout,
    };
  };

  const updateLayoutData = (layout: LayoutItem[]) => {
    if (!currentDashboardId) return;

    const currentDashboard = dashboards.find(
      (d) => d.id === currentDashboardId,
    );
    if (!currentDashboard) return;

    updateDashboardMutation.mutate({
      id: currentDashboardId,
      payload: {
        layout: layout as unknown as Json,
        updated_at: new Date().toISOString(),
      },
    });
  };

  const addWidget = (
    widget: (typeof widgets)[0],
    layoutItem?: Partial<Layout>,
  ) => {
    if (!currentDashboardId) return;

    const currentData = getCurrentLayoutData();
    const widgetId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get default size for the widget type
    const defaultSize = WIDGET_SIZES[widget.type as WidgetType];

    // Create layout item with widget type and settings
    const newLayoutItem: LayoutItem = {
      i: widgetId,
      x: layoutItem?.x ?? 0,
      y: layoutItem?.y ?? 0,
      w: layoutItem?.w ?? defaultSize.w,
      h: layoutItem?.h ?? defaultSize.h,
      minW: defaultSize.minW,
      minH: defaultSize.minH,
      type: widget.type as WidgetType,
      settings: {}, // Default empty settings
      ...layoutItem,
    };

    const updatedLayout = [...currentData.layout, newLayoutItem];

    updateDashboardMutation.mutate({
      id: currentDashboardId,
      payload: {
        layout: updatedLayout as unknown as Json,
        updated_at: new Date().toISOString(),
      },
    });
  };

  const removeWidget = (widgetId: string) => {
    if (!currentDashboardId) return;

    const currentData = getCurrentLayoutData();
    const updatedLayout = currentData.layout.filter(
      (item) => item.i !== widgetId,
    );

    updateDashboardMutation.mutate({
      id: currentDashboardId,
      payload: {
        layout: updatedLayout as unknown as Json,
        updated_at: new Date().toISOString(),
      },
    });
  };

  return (
    <DashboardContext.Provider
      value={{
        dashboards,
        currentDashboardId,
        setCurrentDashboardId,
        createDashboard,
        deleteDashboard,
        getCurrentLayoutData,
        updateLayoutData,
        addWidget,
        removeWidget,
        isLoading:
          isLoading ||
          createDashboardMutation.isPending ||
          updateDashboardMutation.isPending ||
          deleteDashboardMutation.isPending,
        error:
          error ||
          createDashboardMutation.error ||
          updateDashboardMutation.error ||
          deleteDashboardMutation.error,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Layout } from "react-grid-layout";
import { WidgetType } from "./widget_library";
import {
  useDashboards,
  useCreateDashboard,
  useUpdatedDashboard,
  useDeleteDashboard,
} from "@/lib/api";
import type { Dashboard } from "@/types/supabase";

interface WidgetInstance {
  id: string;
  type: string;
  name: string;
}

interface DashboardLayout {
  id: string;
  name: string;
  layout: Layout[];
  widgets: WidgetInstance[];
}

interface DashboardContextType {
  dashboards: Dashboard[];
  currentDashboardId: string | null;
  setCurrentDashboardId: (dashboardId: string) => void;
  createDashboard: (name: string) => void;
  deleteDashboard: (dashboardId: string) => void;
  getCurrentLayoutData: () => DashboardLayout;
  updateLayoutData: (layout: Layout[]) => void;
  addWidget: (widget: WidgetType, layoutItem: Layout) => void;
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

  // Set initial dashboard when dashboards load
  useEffect(() => {
    if (dashboards.length > 0 && !currentDashboardId) {
      setCurrentDashboardId(dashboards[0].id);
    }
  }, [dashboards, currentDashboardId]);

  const createDashboard = (name: string) => {
    const newDashboard = {
      name,
      description: `Dashboard layout: ${name}`,
      layout: [],
      widgets: [],
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
        widgets: [],
      };
    }

    // Parse the stored layout and widgets from the dashboard data
    const layout = Array.isArray(currentDashboard.layout)
      ? currentDashboard.layout
      : [];
    const widgets = Array.isArray(currentDashboard.widgets)
      ? currentDashboard.widgets
      : [];

    return {
      id: currentDashboard.id,
      name: currentDashboard.name,
      layout,
      widgets,
    };
  };

  const updateLayoutData = (layout: Layout[]) => {
    if (!currentDashboardId) return;

    const currentDashboard = dashboards.find(
      (d) => d.id === currentDashboardId,
    );
    if (!currentDashboard) return;

    updateDashboardMutation.mutate({
      id: currentDashboardId,
      payload: {
        layout,
        widgets: getCurrentLayoutData().widgets,
        updated_at: new Date().toISOString(),
      },
    });
  };

  const addWidget = (widget: WidgetType, layoutItem: Layout) => {
    if (!currentDashboardId) return;

    const currentData = getCurrentLayoutData();
    const widgetInstance: WidgetInstance = {
      id: layoutItem.i,
      type: widget.id,
      name: widget.name,
    };

    const updatedWidgets = [...currentData.widgets, widgetInstance];
    const updatedLayout = [...currentData.layout, layoutItem];

    updateDashboardMutation.mutate({
      id: currentDashboardId,
      payload: {
        widgets: updatedWidgets,
        layout: updatedLayout,
        updated_at: new Date().toISOString(),
      },
    });
  };

  const removeWidget = (widgetId: string) => {
    if (!currentDashboardId) return;

    const currentData = getCurrentLayoutData();
    const updatedWidgets = currentData.widgets.filter((w) => w.id !== widgetId);
    const updatedLayout = currentData.layout.filter(
      (item) => item.i !== widgetId,
    );

    updateDashboardMutation.mutate({
      id: currentDashboardId,
      payload: {
        widgets: updatedWidgets,
        layout: updatedLayout,
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

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
  useScreens,
  useCreateScreen,
  useUpdateScreen,
  useDeleteScreen,
} from "@/lib/api";
import type { Screen } from "@/types/supabase";

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
  screens: Screen[];
  currentScreenId: string | null;
  setCurrentScreenId: (screenId: string) => void;
  createScreen: (name: string) => void;
  deleteScreen: (screenId: string) => void;
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
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);

  // API hooks
  const { data: screens = [], isLoading, error } = useScreens();
  const createScreenMutation = useCreateScreen((screen) => {
    setCurrentScreenId(screen.id);
  });
  const updateScreenMutation = useUpdateScreen();
  const deleteScreenMutation = useDeleteScreen();

  // Set initial screen when screens load
  useEffect(() => {
    if (screens.length > 0 && !currentScreenId) {
      setCurrentScreenId(screens[0].id);
    }
  }, [screens, currentScreenId]);

  const createScreen = (name: string) => {
    const newScreen = {
      name,
      description: `Dashboard layout: ${name}`,
      layout: [],
      widgets: [],
    };
    createScreenMutation.mutate(newScreen);
  };

  const deleteScreen = (screenId: string) => {
    deleteScreenMutation.mutate(screenId, {
      onSuccess: () => {
        // If we deleted the current screen, switch to another one
        if (currentScreenId === screenId && screens.length > 1) {
          const remainingScreens = screens.filter((s) => s.id !== screenId);
          if (remainingScreens.length > 0) {
            setCurrentScreenId(remainingScreens[0].id);
          } else {
            setCurrentScreenId(null);
          }
        }
      },
    });
  };

  const getCurrentLayoutData = (): DashboardLayout => {
    const currentScreen = screens.find(
      (screen) => screen.id === currentScreenId,
    );

    if (!currentScreen) {
      return {
        id: "default",
        name: "Default Layout",
        layout: [],
        widgets: [],
      };
    }

    // Parse the stored layout and widgets from the screen data
    const layout = Array.isArray(currentScreen.layout)
      ? currentScreen.layout
      : [];
    const widgets = Array.isArray(currentScreen.widgets)
      ? currentScreen.widgets
      : [];

    return {
      id: currentScreen.id,
      name: currentScreen.name,
      layout,
      widgets,
    };
  };

  const updateLayoutData = (layout: Layout[]) => {
    if (!currentScreenId) return;

    const currentScreen = screens.find((s) => s.id === currentScreenId);
    if (!currentScreen) return;

    updateScreenMutation.mutate({
      id: currentScreenId,
      payload: {
        layout,
        widgets: getCurrentLayoutData().widgets,
        updated_at: new Date().toISOString(),
      },
    });
  };

  const addWidget = (widget: WidgetType, layoutItem: Layout) => {
    if (!currentScreenId) return;

    const currentData = getCurrentLayoutData();
    const widgetInstance: WidgetInstance = {
      id: layoutItem.i,
      type: widget.id,
      name: widget.name,
    };

    const updatedWidgets = [...currentData.widgets, widgetInstance];
    const updatedLayout = [...currentData.layout, layoutItem];

    updateScreenMutation.mutate({
      id: currentScreenId,
      payload: {
        widgets: updatedWidgets,
        layout: updatedLayout,
        updated_at: new Date().toISOString(),
      },
    });
  };

  const removeWidget = (widgetId: string) => {
    if (!currentScreenId) return;

    const currentData = getCurrentLayoutData();
    const updatedWidgets = currentData.widgets.filter((w) => w.id !== widgetId);
    const updatedLayout = currentData.layout.filter(
      (item) => item.i !== widgetId,
    );

    updateScreenMutation.mutate({
      id: currentScreenId,
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
        screens,
        currentScreenId,
        setCurrentScreenId,
        createScreen,
        deleteScreen,
        getCurrentLayoutData,
        updateLayoutData,
        addWidget,
        removeWidget,
        isLoading:
          isLoading ||
          createScreenMutation.isPending ||
          updateScreenMutation.isPending ||
          deleteScreenMutation.isPending,
        error:
          error ||
          createScreenMutation.error ||
          updateScreenMutation.error ||
          deleteScreenMutation.error,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

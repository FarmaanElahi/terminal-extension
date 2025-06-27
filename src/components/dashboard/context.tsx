import { createContext, useContext, useState, ReactNode } from "react";
import { Layout } from "react-grid-layout";
import { WidgetType } from "./widget_library";

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
  layouts: DashboardLayout[];
  currentLayout: string;
  setCurrentLayout: (layoutId: string) => void;
  createLayout: (name: string) => void;
  getCurrentLayoutData: () => DashboardLayout;
  updateLayoutData: (layout: Layout[]) => void;
  addWidget: (widget: WidgetType, layoutItem: Layout) => void;
  removeWidget: (widgetId: string) => void;
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
  const [layouts, setLayouts] = useState<DashboardLayout[]>([
    {
      id: "default",
      name: "Default Layout",
      layout: [],
      widgets: [],
    },
  ]);
  const [currentLayout, setCurrentLayout] = useState("default");

  const createLayout = (name: string) => {
    const newLayout: DashboardLayout = {
      id: `layout-${Date.now()}`,
      name,
      layout: [],
      widgets: [],
    };
    setLayouts((prev) => [...prev, newLayout]);
    setCurrentLayout(newLayout.id);
  };

  const getCurrentLayoutData = () => {
    return layouts.find((layout) => layout.id === currentLayout) || layouts[0];
  };

  const updateLayoutData = (layout: Layout[]) => {
    setLayouts((prev) =>
      prev.map((l) => (l.id === currentLayout ? { ...l, layout } : l)),
    );
  };

  const addWidget = (widget: WidgetType, layoutItem: Layout) => {
    const widgetInstance: WidgetInstance = {
      id: layoutItem.i,
      type: widget.id,
      name: widget.name,
    };

    setLayouts((prev) =>
      prev.map((l) =>
        l.id === currentLayout
          ? {
              ...l,
              widgets: [...l.widgets, widgetInstance],
              layout: [...l.layout, layoutItem],
            }
          : l,
      ),
    );
  };

  const removeWidget = (widgetId: string) => {
    setLayouts((prev) =>
      prev.map((l) =>
        l.id === currentLayout
          ? {
              ...l,
              widgets: l.widgets.filter((w) => w.id !== widgetId),
              layout: l.layout.filter((item) => item.i !== widgetId),
            }
          : l,
      ),
    );
  };

  return (
    <DashboardContext.Provider
      value={{
        layouts,
        currentLayout,
        setCurrentLayout,
        createLayout,
        getCurrentLayoutData,
        updateLayoutData,
        addWidget,
        removeWidget,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

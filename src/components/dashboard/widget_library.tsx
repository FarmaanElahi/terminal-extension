import React from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  DollarSign,
  Clock,
} from "lucide-react";

export interface WidgetType {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  description: string;
}

const availableWidgets: WidgetType[] = [
  {
    id: "price-chart",
    name: "Price Chart",
    icon: <BarChart3 className="w-5 h-5" />,
    category: "Charts",
    description: "Real-time price chart",
  },
  {
    id: "market-depth",
    name: "Market Depth",
    icon: <Activity className="w-5 h-5" />,
    category: "Market Data",
    description: "Order book visualization",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    icon: <PieChart className="w-5 h-5" />,
    category: "Trading",
    description: "Portfolio overview",
  },
  {
    id: "watchlist",
    name: "Watchlist",
    icon: <TrendingUp className="w-5 h-5" />,
    category: "Market Data",
    description: "Stock watchlist",
  },
  {
    id: "order-form",
    name: "Order Form",
    icon: <DollarSign className="w-5 h-5" />,
    category: "Trading",
    description: "Place buy/sell orders",
  },
  {
    id: "trade-history",
    name: "Trade History",
    icon: <Clock className="w-5 h-5" />,
    category: "Trading",
    description: "Recent trades",
  },
];

export function WidgetLibrary() {
  const handleDragStart = (e: React.DragEvent, widget: WidgetType) => {
    e.dataTransfer.setData("application/json", JSON.stringify(widget));
    e.dataTransfer.effectAllowed = "copy";
  };

  const categories = [...new Set(availableWidgets.map((w) => w.category))];

  return (
    <div className="p-4">
      <h3 className="text-foreground font-medium mb-4">Available Widgets</h3>

      {categories.map((category) => (
        <div key={category} className="mb-6">
          <h4 className="text-muted-foreground text-sm font-medium mb-2">
            {category}
          </h4>
          <div className="space-y-2">
            {availableWidgets
              .filter((widget) => widget.category === category)
              .map((widget) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, widget)}
                  className="bg-muted hover:bg-muted/80 p-3 rounded-md cursor-grab active:cursor-grabbing transition-colors border border-transparent hover:border-primary"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-primary">{widget.icon}</div>
                    <div className="flex-1">
                      <div className="text-foreground text-sm font-medium">
                        {widget.name}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {widget.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="mt-6 p-3 bg-muted rounded-md border border-dashed border-border">
        <p className="text-muted-foreground text-xs text-center">
          Drag widgets to the dashboard to add them
        </p>
      </div>
    </div>
  );
}

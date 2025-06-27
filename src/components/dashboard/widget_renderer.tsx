import { BarChart3, X } from "lucide-react";
import { useDashboard } from "./context";

interface WidgetInstance {
  id: string;
  type: string;
  name: string;
}

interface WidgetRendererProps {
  widget: WidgetInstance;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  const { removeWidget } = useDashboard();

  const renderWidgetContent = () => {
    switch (widget.type) {
      case "price-chart":
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-foreground">Price Chart Widget</p>
              <p className="text-muted-foreground text-sm">
                Chart implementation goes here
              </p>
            </div>
          </div>
        );

      case "market-depth":
        return (
          <div className="h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-medium">Market Depth</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-red-500">Sell: 21,450</span>
                <span className="text-muted-foreground">100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-500">Sell: 21,455</span>
                <span className="text-muted-foreground">250</span>
              </div>
              <div className="border-t border-border my-2"></div>
              <div className="flex justify-between text-sm">
                <span className="text-green-500">Buy: 21,445</span>
                <span className="text-muted-foreground">180</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-500">Buy: 21,440</span>
                <span className="text-muted-foreground">320</span>
              </div>
            </div>
          </div>
        );

      case "portfolio":
        return (
          <div className="h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-medium">Portfolio</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="text-foreground">₹2,45,670</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Day P&L:</span>
                <span className="text-green-500">+₹1,250 (+0.51%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overall P&L:</span>
                <span className="text-green-500">+₹15,670 (+6.81%)</span>
              </div>
            </div>
          </div>
        );

      case "watchlist":
        return (
          <div className="h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-medium">Watchlist</h3>
            </div>
            <div className="space-y-2">
              {["RELIANCE", "TCS", "INFY", "HDFC"].map((stock, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-1"
                >
                  <span className="text-foreground text-sm">{stock}</span>
                  <div className="text-right">
                    <div className="text-foreground text-sm">₹2,450</div>
                    <div className="text-green-500 text-xs">+1.2%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "order-form":
        return (
          <div className="h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-medium">Place Order</h3>
            </div>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md text-sm transition-colors">
                  BUY
                </button>
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm transition-colors">
                  SELL
                </button>
              </div>
              <input
                placeholder="Symbol"
                className="w-full bg-input text-foreground px-3 py-2 rounded-md text-sm border border-border focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                placeholder="Quantity"
                className="w-full bg-input text-foreground px-3 py-2 rounded-md text-sm border border-border focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                placeholder="Price"
                className="w-full bg-input text-foreground px-3 py-2 rounded-md text-sm border border-border focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        );

      case "trade-history":
        return (
          <div className="h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-medium">Recent Trades</h3>
            </div>
            <div className="space-y-2">
              {[
                { symbol: "RELIANCE", type: "BUY", qty: "10", price: "2,450" },
                { symbol: "TCS", type: "SELL", qty: "5", price: "3,200" },
                { symbol: "INFY", type: "BUY", qty: "15", price: "1,450" },
              ].map((trade, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-1 text-sm"
                >
                  <div>
                    <span className="text-foreground">{trade.symbol}</span>
                    <span
                      className={`ml-2 ${trade.type === "BUY" ? "text-green-500" : "text-red-500"}`}
                    >
                      {trade.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">
                      {trade.qty} @ ₹{trade.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">Unknown widget type</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full relative">
      {/* Widget Header */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => removeWidget(widget.id)}
          className="bg-muted hover:bg-destructive text-muted-foreground hover:text-destructive-foreground p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Widget Content */}
      {renderWidgetContent()}
    </div>
  );
}

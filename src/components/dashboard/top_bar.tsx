import { Layout, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

interface TopBarProps {
  onLayoutClick: () => void;
}

export function TopBar({ onLayoutClick }: TopBarProps) {
  // Hardcoded market data for now
  const marketData = [
    {
      symbol: "NIFTY 50",
      price: "21,453.95",
      change: "+125.30",
      changePercent: "+0.59%",
      isPositive: true,
    },
    {
      symbol: "SENSEX",
      price: "70,514.19",
      change: "+418.60",
      changePercent: "+0.60%",
      isPositive: true,
    },
    {
      symbol: "BANK NIFTY",
      price: "46,127.85",
      change: "-89.15",
      changePercent: "-0.19%",
      isPositive: false,
    },
    {
      symbol: "NIFTY IT",
      price: "41,246.70",
      change: "+312.45",
      changePercent: "+0.76%",
      isPositive: true,
    },
  ];

  return (
    <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      {/* Market Info */}
      <div className="flex items-center space-x-8">
        {marketData.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-foreground font-medium">{item.symbol}</span>
            <span className="text-foreground text-sm">{item.price}</span>
            <div className="flex items-center space-x-1">
              {item.isPositive ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span
                className={`text-xs ${item.isPositive ? "text-green-500" : "text-red-500"}`}
              >
                {item.change} ({item.changePercent})
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Layout Button */}
      <Button variant="ghost" onClick={onLayoutClick}>
        <Layout className="w-4 h-4" />
      </Button>
    </div>
  );
}

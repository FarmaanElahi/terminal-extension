import "@/global.css";
import { useEffect, useMemo, useState } from "react";

interface Subscription<T> {
  subscribe: (id: string, cb: (p: T) => void) => void;
  unsubscribe: (cb: (p: T) => void) => void;
}

declare global {
  const TradingViewApi: {
    getSymbolInterval: () => { symbol: string; interval: string };
    changeSymbol: (symbol: string, interval: string) => void;
    chart: () => {
      onSymbolChanged: () => Subscription<Record<string, unknown>>;
    };
  };
}

export default function App() {
  const [symbol, setSymbol] = useState<string>();
  useEffect(() => {
    const subscription = TradingViewApi.chart().onSymbolChanged();
    const cb = (p: Record<string, unknown>) => setSymbol(p.name as string);
    setSymbol(TradingViewApi.getSymbolInterval().symbol?.split(":")?.[1]);
    subscription.subscribe("sds", cb);
    return () => subscription.unsubscribe(cb);
  }, []);

  const url = useMemo(
    () =>
      symbol
        ? `https://msindia.farmaan.xyz/mstool/eval/${symbol}/evaluation.jsp#/`
        : null,
    [symbol],
  );

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {url && (
        <iframe
          title={"MS India"}
          src={url}
          className="h-full w-full"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            minWidth: "100%",
            minHeight: "100%",
          }}
        />
      )}
    </div>
  );
}

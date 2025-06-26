interface Subscription<T> {
  subscribe: (id: string, cb: (p: T) => void) => void;
  unsubscribe: (cb: (p: T) => void) => void;
}

export declare global {
  const TradingViewApi: {
    getSymbolInterval: () => { symbol: string; interval: string };
    changeSymbol: (symbol: string, interval: string) => void;
    chart: () => {
      onSymbolChanged: () => Subscription<Record<string, unknown>>;
    };
  };
}

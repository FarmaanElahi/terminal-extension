import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ResolvedSymbol } from "@/types/tradingview";

const SymbolContext = createContext<
  | {
      symbol: string;
      changeSymbol: (symbol: string) => void;
    }
  | undefined
>(undefined);

export function SymbolProvider({ children }: { children?: ReactNode }) {
  const [symbol, setSymbol] = useState(() => {
    try {
      return TradingViewApi.getSymbolInterval().symbol;
    } catch (e) {
      return "NSE:NIFTY";
    }
  });
  useEffect(() => {
    try {
      const subscription = TradingViewApi.chart().onSymbolChanged();
      const cb = (p: ResolvedSymbol) => setSymbol(p.pro_name as string);
      setSymbol(TradingViewApi.getSymbolInterval().symbol);
      subscription.subscribe("sds", cb);
      return () => subscription.unsubscribe(cb);
    } catch (e) {}
  }, []);

  const changeSymbol = useCallback(
    (symbol: string) => {
      console.log("Symbol changed", symbol);
      try {
        TradingViewApi.changeSymbol(
          symbol,
          TradingViewApi.getSymbolInterval().interval,
        );
      } catch (e) {
        setSymbol(symbol);
      }
    },
    [setSymbol],
  );

  console.log("Current symbol", symbol);

  return (
    <SymbolContext.Provider value={{ symbol, changeSymbol }}>
      {children}
    </SymbolContext.Provider>
  );
}

export function useSymbol() {
  return useContext(SymbolContext)?.symbol;
}

export function useSymbolSwitcher() {
  const { changeSymbol } = useContext(SymbolContext)!;
  return changeSymbol;
}

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { sendMessageToCurrentTab } from "@/lib/chrome.ts";
import { BaseEvent } from "@/content/trading_view/type.ts";

const SymbolContext = createContext<
  | {
      symbol: string;
      changeSymbol: (symbol: string) => void;
    }
  | undefined
>(undefined);

export function SymbolProvider({ children }: { children?: ReactNode }) {
  const [symbol, setSymbol] = useState(() => "NSE:RELIANCE");
  useEffect(() => {
    try {
      const cb = (ev: BaseEvent) => {
        if (ev.destination !== "side-panel") return;
        if (ev.type === "symbolChanged") {
          setSymbol(ev.payload.symbol);
        }
      };
      chrome.runtime.onMessage.addListener(cb);
      return () => chrome.runtime.onMessage.removeListener(cb);
    } catch (e) {}
  }, []);

  const changeSymbol = useCallback(
    (symbol: string) => {
      sendMessageToCurrentTab({
        type: "changeSymbol",
        payload: { symbol },
        destination: "page",
      });
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

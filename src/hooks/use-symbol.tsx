import { createContext, ReactNode, useContext } from "react";

const SymbolContext = createContext<string>("NSE:JINDRILL");

export function SymbolProvider({
  symbol,
  children,
}: {
  symbol: string;
  children?: ReactNode;
}) {
  return (
    <SymbolContext.Provider value={symbol}>{children}</SymbolContext.Provider>
  );
}

export function useSymbol() {
  return useContext(SymbolContext);
}

export function useSymbolSwitcher() {
  return (prop: { symbol: string; state?: unknown }) => {
    console.log("Switching to", prop, "symbol");
  };
}

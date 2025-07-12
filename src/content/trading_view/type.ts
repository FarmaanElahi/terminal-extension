// Events sent from the page
export interface SymbolChangedEvent {
  type: "symbolChanged";
  payload: { symbol: string };
  destination: "page" | "content" | "background" | "side-panel";
}

// Event sent from the side panel
export interface ChangeSymbolEvent {
  type: "changeSymbol";
  payload: { symbol: string };
  destination: "page" | "content" | "background";
}

export type BaseEvent = ChangeSymbolEvent | SymbolChangedEvent;

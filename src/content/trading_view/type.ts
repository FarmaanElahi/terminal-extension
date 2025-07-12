export interface ChangeSymbolEvent {
  app: "terminal";
  source: "content" | "side-panel";
  type: "changeSymbol";
  payload: { symbol: string };
}

export interface RelayEvent {
  app: "terminal";
  source: "side-panel";
  type: "relay";
  destination: "page";
  payload: unknown;
}

export type BaseEvent = ChangeSymbolEvent;

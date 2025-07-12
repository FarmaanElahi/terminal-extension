/**
 * Content script that is injected in the TradingView page within the main context
 * This script is responsible for controlling the Tradingview charts.
 * Request will come from other isolated script or the background scrip
 */
import type {
  BaseEvent,
  ChangeSymbolEvent,
  SymbolChangedEvent,
} from "@/content/trading_view/type.ts";
import type { ResolvedSymbol } from "@/types/tradingview";

function pushSymbolChangedEvent() {
  const symbolChanged = TradingViewApi.chart().onSymbolChanged();
  const onSymbolChanged = (r: ResolvedSymbol) => {
    if (r.pro_name?.includes("+")) return;

    window.postMessage(
      {
        type: "symbolChanged",
        payload: { symbol: r.pro_name },
        destination: "side-panel",
      } satisfies SymbolChangedEvent,
      "*",
    );
  };
  symbolChanged.subscribe("mainSymbolChanged", onSymbolChanged);
  return () => {
    symbolChanged.unsubscribe(onSymbolChanged);
  };
}

function changeSymbol(ev: ChangeSymbolEvent) {
  const interval = TradingViewApi.getSymbolInterval().interval;
  TradingViewApi.changeSymbol(ev.payload.symbol, interval);
}

function subscribeToSidePanel() {
  const cb = (event: MessageEvent<BaseEvent>) => {
    if (
      event.source !== window ||
      !event.data ||
      event.data.destination !== "page"
    ) {
      return;
    }
    switch (event.data.type) {
      case "changeSymbol":
        return changeSymbol(event.data);
    }
  };
  window.addEventListener("message", cb);
  return () => window.removeEventListener("message", cb);
}

function unsubAll(...cbs: Array<Function>) {
  window.addEventListener("beforeunload", () => {
    cbs.forEach((cb) => cb());
  });
}

function main() {
  const unsubFromContentScript = subscribeToSidePanel();
  const unSubPushSymbolChangeEvent = pushSymbolChangedEvent();

  unsubAll(unsubFromContentScript, unSubPushSymbolChangeEvent);
}

setTimeout(main, 2000);

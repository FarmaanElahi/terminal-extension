/**
 * Content script that is injected in the TradingView page within the main context
 * This script is responsible for controlling the Tradingview charts.
 * Request will come from other isolated script or the background scrip
 */
import type {
  ChangeSymbolEvent,
  BaseEvent,
} from "@/content/trading_view/type.ts";

function pushSymbolChangedEvent() {
  const symbolChanged = TradingViewApi.chart().onSymbolChanged();
  const onSymbolChanged = (r: unknown) => {
    window.postMessage(
      {
        source: "page",
        type: "symbolChanged",
        payload: r,
      },
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
      event.data.app !== "terminal" ||
      event.data.source !== "side-panel"
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

/**
 * Content script that is injected in the TradingView page within the main context
 * This script is responsible for controlling the Tradingview charts.
 * Request will come from other isolated script or the background scrip
 */

interface ChangeSymbolEvent {
  source: "terminal";
  type: "changeSymbol";
  payload: { symbol: string };
}

type BaseEvent = ChangeSymbolEvent;

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

function subscribeToContentScript() {
  const cb = (event: MessageEvent<BaseEvent>) => {
    if (
      event.source !== window ||
      !event.data ||
      event.data.source !== "terminal"
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
  const unsubFromContentScript = subscribeToContentScript();
  const unSubPushSymbolChangeEvent = pushSymbolChangedEvent();

  unsubAll(unsubFromContentScript, unSubPushSymbolChangeEvent);
}

setTimeout(main, 2000);

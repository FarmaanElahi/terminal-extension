import type {
  BaseEvent,
  SymbolChangedEvent,
} from "@/content/trading_view/type.ts";

function changeSymbol(ev: SymbolChangedEvent) {
  if (ev.payload.symbol.includes("+")) return;
  const [_, symbol] = ev.payload.symbol.split(":");
  if (!symbol) return;

  window.location.replace(
    `https://marketsmithindia.com/mstool/eval/${symbol}/evaluation.jsp#/`,
  );
}

chrome.runtime.onMessage.addListener((request: BaseEvent) => {
  if (request.destination === "page" && request.type === "symbolChanged") {
    changeSymbol(request);
  }
});

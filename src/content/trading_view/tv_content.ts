import { BaseEvent, SymbolChangedEvent } from "@/content/trading_view/type.ts";

chrome.runtime.onMessage.addListener((request: BaseEvent) => {
  if (request.destination === "page") {
    window.postMessage(request, "*");
  }
});

window.addEventListener("message", (ev: MessageEvent<SymbolChangedEvent>) => {
  if (
    ev.data.destination === "background" ||
    ev.data.destination === "side-panel"
  ) {
    void chrome.runtime.sendMessage(ev.data);
  }
});

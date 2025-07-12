import { RelayEvent } from "@/content/trading_view/type.ts";

chrome.runtime.onMessage.addListener((request: RelayEvent) => {
  if (request.type !== "relay") return;
  window.postMessage(request.payload, "*");
});

import { BaseEvent, RelayEvent } from "@/content/trading_view/type.ts";

export function sendMessageToCurrentTab(payload: BaseEvent) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) return;
    const tabId = tabs[0].id;
    void chrome.tabs.sendMessage(tabId as number, {
      app: "terminal",
      source: "side-panel",
      type: "relay",
      destination: "page",
      payload,
    } satisfies RelayEvent);
  });
}

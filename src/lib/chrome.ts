import { BaseEvent } from "@/content/trading_view/type.ts";

export function sendMessageToCurrentTab(payload: BaseEvent) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) return;
    const tabId = tabs[0].id;

    // Send the message to the tab content script
    void chrome.tabs.sendMessage(tabId as number, payload);
  });
}

export function sendMessageToUrl(url: Array<string>, payload: BaseEvent) {
  chrome.tabs.query({ active: true }, (tabs) => {
    if (tabs.length === 0) return;
    tabs
      .filter((t) => url.find((u) => t.url?.startsWith(u)))
      .forEach((t) => {
        if (!t.id) return;

        // Send the message to the tab content script
        void chrome.tabs.sendMessage(t.id as number, payload);
      });
  });
}

import { BaseEvent } from "@/content/trading_view/type.ts";

export function sendMessageToCurrentTab(payload: BaseEvent) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) return;
    const tabId = tabs[0].id;

    // Send the message to the tab content script
    void chrome.tabs.sendMessage(tabId as number, payload);
  });
}

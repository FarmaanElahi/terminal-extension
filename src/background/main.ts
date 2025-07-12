import { BaseEvent } from "@/content/trading_view/type.ts";

const TRADINGVIEW_SIDE_PANEL_URL = "https://in.tradingview.com";

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, _, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  // Enables the side panel on google.com
  if (url.origin === TRADINGVIEW_SIDE_PANEL_URL) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: "index.html",
      enabled: true,
    });
  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    });
  }
});

let sidePanelPort: chrome.runtime.Port | null = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "sidepanel") {
    sidePanelPort = port;
    console.log("Side panel connected.");

    port.onDisconnect.addListener(() => {
      sidePanelPort = null;
      console.log("Side panel disconnected.");
    });
  }
});

chrome.runtime.onMessage.addListener((message: BaseEvent) => {
  if (message.destination === "side-panel" && sidePanelPort) {
    sidePanelPort.postMessage(message);
  }
});

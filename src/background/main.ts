import { proxyFetch } from "@/background/proxy_fetch.ts";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "proxyFetch") {
    return proxyFetch(message, sender, sendResponse);
  }
});

import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "Terminal",
  version: pkg.version,
  icons: {
    48: "public/logo.png",
  },
  action: {
    default_icon: {
      48: "public/logo.png",
    },
    default_title: "Open Panel",
  },
  content_scripts: [
    {
      js: ["src/content/trading_view/tv_content.ts"],
      matches: ["https://in.tradingview.com/*"],
    },
    {
      js: ["src/content/market_smith/ms_main.ts"],
      matches: ["https://marketsmithindia.com/*"],
    },
    {
      // @ts-ignore
      world: "MAIN",
      js: ["src/content/trading_view/tv_main.ts"],
      matches: ["https://in.tradingview.com/*"],
    },
  ],
  permissions: [
    "storage",
    "scripting",
    "tabs",
    "notifications",
    "sidePanel",
    "declarativeNetRequest",
    "declarativeNetRequestFeedback",
  ],
  web_accessible_resources: [
    {
      resources: ["*.js", "*.css", "*.svg"],
      matches: ["*://*/*"],
    },
  ],
  host_permissions: ["<all_urls>"],
  background: {
    service_worker: "src/background/main.ts",
    type: "module",
  },
  side_panel: {
    default_path: "index.html",
  },
});

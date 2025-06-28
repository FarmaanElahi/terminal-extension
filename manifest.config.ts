import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: "public/logo.png",
  },
  action: {
    default_icon: {
      48: "public/logo.png",
    },
  },
  content_scripts: [
    {
      js: ["src/content/trading_view/tv_content.ts"],
      matches: ["https://in.tradingview.com/*"],
      run_at: "document_start",
    },
    {
      // @ts-ignore
      world: "MAIN",
      js: ["src/content/trading_view/tv.tsx"],
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
  declarative_net_request: {
    rule_resources: [
      {
        id: "proxy_rules",
        enabled: true,
        path: "rules.json",
      },
    ],
  },
  web_accessible_resources: [
    {
      resources: ["*.js", "*.css", "*.svg"],
      matches: ["*://*/*"],
    },
  ],
  host_permissions: ["<all_urls>"],
});

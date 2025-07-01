import { type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

function tradingViewInit(app: ReactNode) {
  let visibleRoot: any = null;
  let appContainer: HTMLDivElement | null = null;
  let isAppLoaded = false;

  // Inject our button next to the Chats button
  const injectButton = () => {
    // Find the Chats button
    const chatsButton = document.querySelector('button[aria-label="Chats"]');
    if (!chatsButton || document.getElementById("tv-extension-toggle-button")) {
      return; // Button already exists or can't find the Chats button
    }

    // Create our extension button with the same styling
    const extensionButton = document.createElement("button");
    extensionButton.id = "tv-extension-toggle-button";
    extensionButton.setAttribute("aria-label", "Extension");
    extensionButton.setAttribute("aria-pressed", "false");
    extensionButton.setAttribute("tabindex", "-1");
    extensionButton.setAttribute("type", "button");
    extensionButton.setAttribute("data-name", "extension");
    extensionButton.setAttribute("data-tooltip", "Extension");

    // Copy the classes from the Chats button
    extensionButton.className = chatsButton.className;

    // Create the icon span
    const iconSpan = document.createElement("span");
    iconSpan.setAttribute("role", "img");
    iconSpan.setAttribute("aria-hidden", "true");

    // Copy the class from the chats button icon
    const chatsIconSpan = chatsButton.querySelector("span");
    if (chatsIconSpan) {
      iconSpan.className = chatsIconSpan.className;
    }

    // Create SVG icon (similar style to other TradingView icons)
    iconSpan.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="44" height="44">
        <path fill="currentColor" fill-rule="evenodd" d="M22 12c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path>
      </svg>
    `;

    extensionButton.appendChild(iconSpan);

    // Add the button next to Chats button
    chatsButton.parentNode?.insertBefore(
      extensionButton,
      chatsButton.nextSibling,
    );

    // Function to load and render React app only when button is clicked
    const loadReactApp = () => {
      // Prevent multiple loads
      if (isAppLoaded) {
        return;
      }

      // Find the chart page grid area div
      const chartPageGridArea = document.querySelectorAll(
        'div[data-qa-id="chart-page-grid-area"]',
      )?.[1];

      if (!chartPageGridArea) {
        console.warn("Chart page grid area not found, skipping injection");
        return;
      }

      // Clear the existing content
      chartPageGridArea.innerHTML = "";

      // Create a container for our React app
      appContainer = document.createElement("div");
      appContainer.id = "tv-extension-app-container";
      appContainer.style.width = "100%";
      appContainer.style.height = "100%";

      chartPageGridArea.appendChild(appContainer);

      // Render React app in the visible container (first time loading)
      visibleRoot = createRoot(appContainer);
      visibleRoot.render(app);

      // Update button state and flag
      extensionButton.setAttribute("aria-pressed", "true");
      isAppLoaded = true;
    };

    // Add click handler to load React app
    extensionButton.addEventListener("click", loadReactApp);
  };

  // Inject the button (no invisible app creation)
  injectButton();

  // Set up a MutationObserver to detect if the TradingView UI changes
  // and re-inject our button if needed
  const observer = new MutationObserver(() => {
    if (!document.getElementById("tv-extension-toggle-button")) {
      injectButton();
    }
  });

  // Start observing the document body for changes
  observer.observe(document.body, { childList: true, subtree: true });

  // Return a cleanup function to disconnect the observer when no longer needed
  return () => {
    observer.disconnect();

    // Clean up all created elements
    const button = document.getElementById("tv-extension-toggle-button");
    if (button) button.remove();

    if (appContainer) appContainer.remove();

    // Unmount React root
    if (visibleRoot) {
      visibleRoot.unmount();
    }
  };
}

setTimeout(() => tradingViewInit(<App />), 2000);

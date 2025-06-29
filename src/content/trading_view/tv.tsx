import { type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

function tradingViewInit(app: ReactNode) {
  let invisibleRoot: any = null;
  let visibleRoot: any = null;
  let appContainer: HTMLDivElement | null = null;

  // Create invisible container and render React app
  const createInvisibleApp = () => {
    // Create invisible container
    const invisibleContainer = document.createElement("div");
    invisibleContainer.id = "tv-extension-invisible-container";
    invisibleContainer.style.position = "absolute";
    invisibleContainer.style.left = "-9999px";
    invisibleContainer.style.top = "-9999px";
    invisibleContainer.style.width = "100%";
    invisibleContainer.style.height = "100%";
    invisibleContainer.style.visibility = "hidden";
    invisibleContainer.style.pointerEvents = "none";

    // Append to body
    document.body.appendChild(invisibleContainer);

    // Render React app in invisible container
    invisibleRoot = createRoot(invisibleContainer);
    invisibleRoot.render(app);

    return invisibleContainer;
  };

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

    // Function to move React app from invisible to visible container
    const moveReactAppToVisible = () => {
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

      // Unmount from invisible container
      if (invisibleRoot) {
        invisibleRoot.unmount();
        invisibleRoot = null;
      }

      // Remove invisible container
      const invisibleContainer = document.getElementById(
        "tv-extension-invisible-container",
      );
      if (invisibleContainer) {
        invisibleContainer.remove();
      }

      // Render React app in the visible container
      visibleRoot = createRoot(appContainer);
      visibleRoot.render(app);

      // Update button state
      extensionButton.setAttribute("aria-pressed", "true");
    };

    // Add click handler to move React app to visible
    extensionButton.addEventListener("click", moveReactAppToVisible);
  };

  // Initialize invisible app first
  createInvisibleApp();

  // Inject the button
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

    const invisibleContainer = document.getElementById(
      "tv-extension-invisible-container",
    );
    if (invisibleContainer) invisibleContainer.remove();

    if (appContainer) appContainer.remove();

    // Unmount React roots
    if (invisibleRoot) {
      invisibleRoot.unmount();
    }
    if (visibleRoot) {
      visibleRoot.unmount();
    }
  };
}

setTimeout(() => tradingViewInit(<App />), 2000);

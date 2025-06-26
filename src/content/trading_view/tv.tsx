import { type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

declare global {
  interface Window {
    documentPictureInPicture: {
      requestWindow: (a: unknown) => Promise<Window>;
    };
  }
}

function tradingViewInit(app: ReactNode, pip?: true) {
  // Track if PiP window is open
  let pipWindow: Window | null = null;

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

    // Function to toggle Document PiP
    const toggleDocumentPiP = async () => {
      // If PiP window is already open, close it
      if (pipWindow) {
        pipWindow.close();
        pipWindow = null;
        extensionButton.setAttribute("aria-pressed", "false");
        return;
      }

      try {
        // Check if Document PiP API is available
        if (pip && "documentPictureInPicture" in window) {
          // Open a PiP window with dimensions
          pipWindow = await window.documentPictureInPicture.requestWindow({
            width: 400,
            height: 300,
          });

          // Mark button as active
          extensionButton.setAttribute("aria-pressed", "true");

          // Create styles for the PiP window
          const style = document.createElement("style");
          style.textContent = `
            :root {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color-scheme: dark;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: rgba(30, 34, 45, 0.95);
              color: #d1d4dc;
              height: 100vh;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 12px;
              border-bottom: 1px solid rgba(150, 150, 150, 0.2);
              user-select: none;
            }
            .title {
              font-weight: bold;
            }
            .close-button {
              background: none;
              border: none;
              color: #d1d4dc;
              font-size: 16px;
              cursor: pointer;
            }
            .content {
              flex: 1;
              overflow: auto;
              display: flex;
              flex-direction: column;
            }
          `;

          // Add styles to PiP window
          pipWindow.document.head.appendChild(style);

          // Create header with title and close button
          const header = document.createElement("div");
          header.className = "header";

          const title = document.createElement("div");
          title.className = "title";
          title.textContent = "TradingView Extension";

          const closeButton = document.createElement("button");
          closeButton.className = "close-button";
          closeButton.textContent = "×";
          closeButton.addEventListener("click", () => {
            pipWindow?.close();
            pipWindow = null;
            extensionButton.setAttribute("aria-pressed", "false");
          });

          header.appendChild(title);
          header.appendChild(closeButton);

          // Create content container
          const content = document.createElement("div");
          content.className = "content";

          // Add elements to PiP document
          pipWindow.document.body.appendChild(header);
          pipWindow.document.body.appendChild(content);

          // Render React app in the PiP window
          createRoot(content).render(app);

          // Close PiP window when it's closed by the user
          pipWindow.addEventListener("pagehide", () => {
            pipWindow = null;
            extensionButton.setAttribute("aria-pressed", "false");
          });
        } else {
          // Fallback for browsers without Document PiP support
          createFloatingWindow();
        }
      } catch (error) {
        console.error("Document PiP failed:", error);
        // Fallback to floating window
        createFloatingWindow();
      }
    };

    // Create a floating window as fallback
    const createFloatingWindow = () => {
      const container = document.getElementById(
        "tv-extension-floating-container",
      );
      if (container) {
        container.style.display = "flex";
        extensionButton.setAttribute("aria-pressed", "true");
        return;
      }

      const floatingContainer = document.createElement("div");
      floatingContainer.id = "tv-extension-floating-container";
      floatingContainer.style.position = "fixed";
      floatingContainer.style.top = "60px";
      floatingContainer.style.right = "20px";
      floatingContainer.style.width = "400px";
      floatingContainer.style.height = "300px";
      floatingContainer.style.backgroundColor = "rgba(30, 34, 45, 0.95)";
      floatingContainer.style.color = "#d1d4dc";
      floatingContainer.style.zIndex = "10000";
      floatingContainer.style.borderRadius = "4px";
      floatingContainer.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.3)";
      floatingContainer.style.display = "flex";
      floatingContainer.style.flexDirection = "column";
      floatingContainer.style.overflow = "hidden";

      // Create header
      const header = document.createElement("div");
      header.style.padding = "8px 12px";
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.borderBottom = "1px solid rgba(150, 150, 150, 0.2)";
      header.style.cursor = "move";

      const title = document.createElement("div");
      title.textContent = "TradingView Extension";
      title.style.fontWeight = "bold";

      const closeButton = document.createElement("button");
      closeButton.textContent = "×";
      closeButton.style.background = "none";
      closeButton.style.border = "none";
      closeButton.style.color = "#d1d4dc";
      closeButton.style.fontSize = "16px";
      closeButton.style.cursor = "pointer";

      header.appendChild(title);
      header.appendChild(closeButton);

      // Create content container for the React app
      const content = document.createElement("div");
      content.style.flex = "1";
      content.style.overflow = "auto";
      content.style.display = "flex";
      content.style.flexDirection = "column";

      floatingContainer.appendChild(header);
      floatingContainer.appendChild(content);

      document.body.appendChild(floatingContainer);

      // Render React app in the content
      createRoot(content).render(app);

      // Make window draggable
      let isDragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;

      header.addEventListener("mousedown", (e) => {
        isDragging = true;
        dragOffsetX =
          e.clientX - floatingContainer.getBoundingClientRect().left;
        dragOffsetY = e.clientY - floatingContainer.getBoundingClientRect().top;
      });

      document.addEventListener("mousemove", (e) => {
        if (isDragging) {
          floatingContainer.style.left = e.clientX - dragOffsetX + "px";
          floatingContainer.style.top = e.clientY - dragOffsetY + "px";
          floatingContainer.style.right = "auto";
        }
      });

      document.addEventListener("mouseup", () => {
        isDragging = false;
      });

      // Handle close button
      closeButton.addEventListener("click", () => {
        floatingContainer.style.display = "none";
        extensionButton.setAttribute("aria-pressed", "false");
      });

      // Add resize handle
      const resizeHandle = document.createElement("div");
      resizeHandle.style.position = "absolute";
      resizeHandle.style.bottom = "0";
      resizeHandle.style.right = "0";
      resizeHandle.style.width = "15px";
      resizeHandle.style.height = "15px";
      resizeHandle.style.cursor = "nwse-resize";
      resizeHandle.style.backgroundImage =
        "linear-gradient(135deg, transparent 50%, rgba(150, 150, 150, 0.5) 50%)";

      floatingContainer.appendChild(resizeHandle);

      // Make window resizable
      let isResizing = false;

      resizeHandle.addEventListener("mousedown", (e) => {
        isResizing = true;
        e.preventDefault();
      });

      document.addEventListener("mousemove", (e) => {
        if (isResizing) {
          const width =
            e.clientX - floatingContainer.getBoundingClientRect().left;
          const height =
            e.clientY - floatingContainer.getBoundingClientRect().top;
          floatingContainer.style.width = Math.max(200, width) + "px"; // Minimum width of 200px
          floatingContainer.style.height = Math.max(150, height) + "px"; // Minimum height of 150px
        }
      });

      document.addEventListener("mouseup", () => {
        isResizing = false;
      });

      extensionButton.setAttribute("aria-pressed", "true");
    };

    // Add click handler to toggle PiP
    extensionButton.addEventListener("click", toggleDocumentPiP);
  };

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

    const floatingContainer = document.getElementById(
      "tv-extension-floating-container",
    );
    if (floatingContainer) floatingContainer.remove();

    // Close PiP window if open
    if (pipWindow) {
      pipWindow.close();
      pipWindow = null;
    }
  };
}

setTimeout(() => tradingViewInit(<App />, true), 2000);

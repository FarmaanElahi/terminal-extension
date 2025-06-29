export function proxyFetch(
  message: unknown,
  __: chrome.runtime.MessageSender,
  sendResponse: (r?: unknown) => void,
) {
  const { url, options } = message as {
    url: string;
    options: RequestInit;
  };

  fetch(url, options)
    .then(async (response) => {
      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      const body = isJson ? await response.json() : await response.text();

      sendResponse({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body,
      });
    })
    .catch((error) => {
      sendResponse({ error: error.toString() });
    });

  return true; // Keep the message channel open for async response
}

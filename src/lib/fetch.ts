interface ProxyFetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  error?: string;
}

export function proxyFetch(
  url: string,
  options: RequestInit = {},
): Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  json: () => Promise<any>;
  text: () => Promise<string>;
}> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "proxyFetch",
        url,
        options,
      },
      (response: ProxyFetchResponse) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        if (response.error) {
          return reject(new Error(response.error));
        }

        const proxyResponse = {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          json: () => Promise.resolve(response.body),
          text: () =>
            typeof response.body === "string"
              ? Promise.resolve(response.body)
              : Promise.resolve(JSON.stringify(response.body)),
        };

        resolve(proxyResponse);
      },
    );
  });
}

declare global {
  interface Window {
    proxyFetch: typeof proxyFetch;
  }
}

window.proxyFetch = proxyFetch;

setTimeout(() => {
  const tvCSSUrl = chrome.runtime.getURL("assets/tv.css");
  document.body.setAttribute("data-tv-css-url", tvCSSUrl);
}, 1000);

const ENVLY_URL = "https://envly.vercel.app";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_URL") {
    fetch(`${ENVLY_URL}/api/wishes/check?url=${encodeURIComponent(message.url)}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => sendResponse(data))
      .catch(() => sendResponse({ exists: false }));
    return true; // keep channel open for async response
  }
});

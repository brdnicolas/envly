// Talks to envly.fr with the user's session cookies (content scripts can't, because of CORS).
const ENVLY_URL = "https://www.envly.fr";

async function call(path, init = {}) {
  const res = await fetch(`${ENVLY_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "CHECK_URL":
        return call(`/api/wishes/check?url=${encodeURIComponent(message.url)}`);
      case "GET_COLLECTIONS":
        return call("/api/collections");
      case "ADD_WISH":
        return call("/api/wishes", { method: "POST", body: JSON.stringify(message.wish) });
      case "OPEN":
        await chrome.tabs.create({ url: `${ENVLY_URL}${message.path}` });
        return { ok: true };
      default:
        return { ok: false };
    }
  })()
    .then(sendResponse)
    .catch(() => sendResponse({ ok: false, status: 0, data: {} }));
  return true; // async response
});

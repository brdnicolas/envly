// Toolbar button: open the in-page panel on the current tab. If the page can't host it
// (chrome:// pages, the Web Store…), show a short message instead.
document.getElementById("open").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://www.envly.fr" });
  window.close();
});

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "OPEN_PANEL" }, (res) => {
    if (chrome.runtime.lastError || !res?.ok) {
      document.getElementById("msg").textContent =
        "Envly ne peut pas s’afficher sur cette page. Ouvrez une fiche produit, puis cliquez à nouveau.";
      return;
    }
    window.close();
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        chrome.tabs.sendMessage(tabId, "render-dash");
        chrome.tabs.sendMessage(tabId, "render-old");
        chrome.tabs.sendMessage(tabId, "add-bubble");
    }
})
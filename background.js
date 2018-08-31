var tippStat; // Variable to store Tippanee's status

// Sends parameters to content-script when a tab is updated
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.highlighted === true && tab.url !== 'chrome://newtab/' && changeInfo.status === 'complete') {
        //alert("Page Loaded");
        tippStat = true; // Initialize Tippanee's status as ON

        renderTipp(function () {
            chrome.tabs.sendMessage(tabId, "tab-actvtd"); // Tab activated
        });

        function renderTipp(callback) {
            chrome.tabs.sendMessage(tabId, "render-tipp"); // Render Tippanee
            callback();
        }
    }
});

// Sends parameters to content-script when a tab is activated
chrome.tabs.onHighlighted.addListener(function (activeInfo) { //alternative 'onActivated'
    chrome.browserAction.setBadgeText({
        text: ''
    });

    renderTipp(function () {
        chrome.tabs.sendMessage(activeInfo.tabIds[0], "tab-actvtd"); // Tab activated
    });

    function renderTipp(callback) {
        chrome.tabs.sendMessage(activeInfo.tabIds[0], "render-tipp"); // Render Tippanee
        callback();
    }
});

// Execute on recieving message from content-script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.type) {
        case "updateBadge":
            chrome.browserAction.setBadgeText({
                text: message.data.text
            });
            break;

        case "retrieveTrans":
            console.log(message.data.baseurl);

            var XHrRes = {};

            var XHr = new XMLHttpRequest();
            XHr.open("POST", "https://shrouded-beyond-85340.herokuapp.com/", true); // https://shrouded-beyond-85340.herokuapp.com/

            XHr.onreadystatechange = function () {
                if (XHr.readyState == 4 && XHr.status == 200) {
                    //console.log("Success");
                    XHrRes.status = 1;
                    XHrRes.text = XHr.responseText;
                    chrome.tabs.sendMessage(sender.tab.id, XHrRes);
                }
                else if (XHr.status == 0) {
                    XHrRes.status = 0;
                    XHrRes.text = "";
                    chrome.tabs.sendMessage(sender.tab.id, XHrRes);
                }
            };

            XHr.setRequestHeader("Content-Type", "application/json");
            XHr.send(JSON.stringify({
                action: message.data
            }));

            break;

        default:
            console.warn("Unrecognized message type: " + message.type);
            break;
    }
});


// Update Tippanee status
function updateTippStat(tabId) {
    if (tippStat === true) { // If Tippanee's status is ON
        tippStat = false; // Change Tippanee status to OFF
        chrome.browserAction.setIcon({ // Update Tippanee icons
            path: {
                "16": "/icons/icon16gs.png",
                "32": "/icons/icon32gs.png",
                "64": "/icons/icon64gs.png",
                "128": "/icons/icon128gs.png",
                "256": "/icons/icon256gs.png",
            }
        });
        chrome.tabs.sendMessage(tabId, "clear-tipp"); // Clear Tippanee
        chrome.browserAction.setBadgeText({
            text: ''
        });
    } else { // If Tippanee's status is OFF
        tippStat = true; // Change Tippanee status to ON
        chrome.browserAction.setIcon({ // Update Tippanee icons
            path: {
                "16": "/icons/icon16.png",
                "32": "/icons/icon32.png",
                "64": "/icons/icon64.png",
                "128": "/icons/icon128.png",
                "256": "/icons/icon256.png",
            }
        });
        chrome.tabs.sendMessage(tabId, "render-tipp"); // Render Tippanee
    }
}


// Sends parameters to content-script when extension icon is clicked
chrome.browserAction.onClicked.addListener(function (tab) {
    //alert('Icon Clicked');
    updateTippStat(tab.id); // Call function to update Tippanee's status
});
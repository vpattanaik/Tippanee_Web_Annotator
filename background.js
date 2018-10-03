var domLoaded = {}; // Status of webpage DOM - loaded? true or false
var domChnged = {};
var tippToggle = {}; // Status of Tippanee Browser Button - enabled? true or false
var tippLoaded = {}; // Status of Tippanee Dashboard - loaded? true or false
var oCtmstmp = [];
var oHSUtmstmp = [];
var hghltdTab;

// Initializes Tippanee status for every new tab
chrome.tabs.onCreated.addListener(function (tab) {
    var tId = tab.id;
    // Default for tab when new tab is created
    domLoaded[tId] = false;
    domChnged[tId] = false;
    tippToggle[tId] = true;
    tippLoaded[tId] = false;
});

function checkStatVars(tId) {
    if (typeof domLoaded[tId] == "undefined") { // OR typeof tippToggle[tId] == "undefined" OR typeof tippLoaded[tId] == "undefined"
        domLoaded[tId] = false;
        domChnged[tId] = false;
        tippToggle[tId] = true;
        tippLoaded[tId] = false;
    }
}


var nav = new NavigationCollector();

var eventList = ['onBeforeNavigate', 'onCreatedNavigationTarget',
    'onCommitted', 'onCompleted', 'onDOMContentLoaded',
    'onErrorOccurred', 'onReferenceFragmentUpdated', 'onTabReplaced',
    'onHistoryStateUpdated'
];

eventList.forEach(function (e) {
    chrome.webNavigation[e].addListener(function (data) {
        if (typeof data) {
            var tId = data.tabId;
            checkStatVars(tId);

            //console.log(chrome.i18n.getMessage('inHandler'), e, data);
            if (e == 'onCompleted' || e == 'onHistoryStateUpdated' || e == 'onReferenceFragmentUpdated') {
                domLoaded[tId] = true;
            } else {
                domLoaded[tId] = false;
            }

            if (data.tabId === hghltdTab) { //data.frameId == 0
                if (e == 'onHistoryStateUpdated') {
                    oHSUtmstmp.push(data.timeStamp);
                } else {
                    oHSUtmstmp = [];
                }

                if (e == 'onBeforeNavigate' || e == 'onCommitted' || e == 'onDOMContentLoaded' || e == 'onCompleted') {
                    if (e == 'onCompleted') {
                        //console.log('TStamp: ' + data.timeStamp);
                        oCtmstmp.push(data.timeStamp);
                    }
                } else {
                    oCtmstmp = [];
                }

                if (e == 'onCompleted' &&
                (oCtmstmp.length < 2 || oCtmstmp[oCtmstmp.length - 1] - oCtmstmp[oCtmstmp.length - 2] > 1000)) { 
                    //oCtmstmp.length < 2 || oCtmstmp[oCtmstmp.length - 1] - oCtmstmp[oCtmstmp.length - 2] > 500

                    //console.log(chrome.i18n.getMessage('inHandler'), e, data);

                    tippLoaded[tId] = false;

                    checkStatVars(tId);

                    chngTippLogo(data.tabId, tippToggle[tId]);

                    if (tippToggle[tId] === true) { //  && changeInfo.status === 'complete'
                        domLoaded[tId] = true;

                        if (tippLoaded[tId] === false) {
                            //console.log(chrome.i18n.getMessage('inHandler'), e, data);
                            chrome.tabs.sendMessage(data.tabId, "render-tipp"); // Render Tippanee
                            tippLoaded[tId] = true;
                        }

                    } else {
                        domLoaded[tId] = false;
                        tippLoaded[tId] = false;
                    }

                } else if (
                    (
                        e == 'onHistoryStateUpdated' &&
                        (data.transitionType == 'link' || data.transitionType == 'reload') &&
                        (oHSUtmstmp.length < 2 || oHSUtmstmp[oHSUtmstmp.length - 1] - oHSUtmstmp[oHSUtmstmp.length - 2] > 100)
                    ) ||
                    (
                        e == 'onReferenceFragmentUpdated' &&
                        (data.transitionType == 'reload' || data.transitionType == 'auto_bookmark')
                    )
                ) {
                    //console.log(chrome.i18n.getMessage('inHandler'), e, data);

                    chngTippLogo(data.tabId, tippToggle[tId]);

                    if (tippToggle[tId] === true) { //  && changeInfo.status === 'complete'
                        if (tippLoaded[tId] === false) {
                            chrome.tabs.sendMessage(data.tabId, "render-tipp"); // Render Tippanee
                            tippLoaded[tId] = true;
                        } else {
                            chrome.tabs.sendMessage(data.tabId, "update-tipp"); // Render Tippanee
                            tippLoaded[tId] = true;
                        }
                    } else {
                        tippLoaded[tId] = false;
                    }
                }
            }
        } else {
            console.error(chrome.i18n.getMessage('inHandlerError'), e);
        }
    });
});

// Reset the navigation state on startup. We only want to collect data within a session.
chrome.runtime.onStartup.addListener(function () {
    nav.resetDataStorage();
});

// Sends parameters to content-script when a tab is activated
chrome.tabs.onHighlighted.addListener(function (activeInfo) { //alternative 'onActivated'
    var tId = activeInfo.tabIds[0];

    hghltdTab = activeInfo.tabIds[0];

    chngTippLogo(activeInfo.tabIds[0], tippToggle[tId]);

    chrome.browserAction.setBadgeText({
        text: ""
    });

    if (tippToggle[tId] === true && domLoaded[tId] === true && tippLoaded[tId] === false) {
        chrome.tabs.sendMessage(activeInfo.tabIds[0], "render-tipp"); // Render Tippanee
        tippLoaded[tId] = true;
    } else if (tippLoaded[tId] === true && tippToggle[tId] === true) {
        chrome.tabs.sendMessage(activeInfo.tabIds[0], "tab-actvtd");
    }
});

// Sends parameters to content-script when extension icon is clicked
chrome.browserAction.onClicked.addListener(function (tab) {
    //alert('Icon Clicked');
    var tId = tab.id;
    if (tippToggle[tId] === true) {
        tippToggle[tId] = false;
    } else {
        tippToggle[tId] = true;
    }
    updtTippStat(tab.id, tippToggle[tId]);
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
            //console.log(message.data.baseurl);
            var XHrRes = {};
            var XHr = new XMLHttpRequest();
            XHr.open("POST", "https://shrouded-beyond-85340.herokuapp.com/", true); // https://shrouded-beyond-85340.herokuapp.com/
            XHr.onreadystatechange = function () {
                if (XHr.readyState == 4 && XHr.status == 200) {
                    //console.log("Success");
                    XHrRes.status = 1;
                    XHrRes.text = XHr.responseText;
                    chrome.tabs.sendMessage(sender.tab.id, XHrRes);
                } else if (XHr.status == 0) {
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
            //console.log("Unrecognized message type: " + message.type);
            break;
    }
});


// Update Tippanee status
function updtTippStat(tabId, tippStat) {
    if (tippStat === false) { // If Tippanee's status should be OFF
        chrome.browserAction.setBadgeText({
            text: ""
        });
        chngTippLogo(tabId, tippStat);
        chrome.tabs.sendMessage(tabId, "clear-tipp"); // Clear Tippanee
    } else { // If Tippanee's status should be ON
        chngTippLogo(tabId, tippStat);
        chrome.tabs.sendMessage(tabId, "render-tipp"); // Render Tippanee
    }
}

// Update Tippanee Logo
function chngTippLogo(tabId, tippStat) {
    if (tippStat === false) { // If Tippanee's status should be OFF
        chrome.browserAction.setIcon({ // Update Tippanee icons
            path: {
                "16": "/icons/icon16gs.png",
                "32": "/icons/icon32gs.png",
                "64": "/icons/icon64gs.png",
                "128": "/icons/icon128gs.png",
                "256": "/icons/icon256gs.png",
            }
        });
    } else { // If Tippanee's status should be ON
        chrome.browserAction.setIcon({ // Update Tippanee icons
            path: {
                "16": "/icons/icon16.png",
                "32": "/icons/icon32.png",
                "64": "/icons/icon64.png",
                "128": "/icons/icon128.png",
                "256": "/icons/icon256.png",
            }
        });
    }
}
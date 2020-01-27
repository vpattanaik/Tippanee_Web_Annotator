var domLoaded = {}; // Status of webpage DOM - loaded? true or false
var domChnged = {};
var tippToggle = {}; // Status of Tippanee Browser Button - enabled? true or false
var tippLoaded = {}; // Status of Tippanee Dashboard - loaded? true or false
var oCtmstmp = [];
var oHSUtmstmp = [];
var hghltdTab;
var userName = null;
var annoData = {};
var grpData = [];

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
            var msg = {};
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
                            msg.type = "render-tipp";
                            msg.usr = userName;
                            chrome.tabs.sendMessage(data.tabId, msg); // Render Tippanee
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
                            msg.type = "render-tipp";
                            msg.usr = userName;
                            chrome.tabs.sendMessage(data.tabId, msg); // Render Tippanee
                            tippLoaded[tId] = true;
                        } else {
                            msg.type = "update-tipp";
                            chrome.tabs.sendMessage(data.tabId, msg); // Render Tippanee
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
    var msg = {};
    var tId = activeInfo.tabIds[0];

    hghltdTab = activeInfo.tabIds[0];

    chngTippLogo(activeInfo.tabIds[0], tippToggle[tId]);

    chrome.browserAction.setBadgeText({
        text: ""
    });

    if (tippToggle[tId] === true && domLoaded[tId] === true && tippLoaded[tId] === false) {

        msg.type = "render-tipp";
        msg.usr = userName;
        chrome.tabs.sendMessage(activeInfo.tabIds[0], msg); // Render Tippanee
        tippLoaded[tId] = true;
    } else if (tippLoaded[tId] === true && tippToggle[tId] === true) {
        msg.type = "tab-actvtd";
        chrome.tabs.sendMessage(activeInfo.tabIds[0], msg);
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

        case "checkUserLogin":
            userLoginChanged(sender.tab.id, message.data);
            break;

        case "checkServerData":
            serverDataChanged(sender.tab.id, message.data);
            break;

        default:
            //console.log("Unrecognized message type: " + message.type);
            break;
    }
});


// Update Tippanee status
function updtTippStat(tabId, tippStat) {
    var msg = {};
    if (tippStat === false) { // If Tippanee's status should be OFF
        chrome.browserAction.setBadgeText({
            text: ""
        });
        chngTippLogo(tabId, tippStat);
        msg.type = "clear-tipp";
        chrome.tabs.sendMessage(tabId, msg); // Clear Tippanee
    } else { // If Tippanee's status should be ON
        chngTippLogo(tabId, tippStat);
        msg.type = "render-tipp";
        msg.usr = userName;
        chrome.tabs.sendMessage(tabId, msg); // Render Tippanee
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

/////////////////////////////////////////////////////////////////////////////////////
// Firebase user authentication
/////////////////////////////////////////////////////////////////////////////////////

var config = {
    apiKey: "AIzaSyD7yCi-WTvo0Ln744YrAdBRr-xI5XnDsrk",
    authDomain: "tippaneemessagingserver.firebaseapp.com",
    databaseURL: "https://tippaneemessagingserver.firebaseio.com",
    projectId: "tippaneemessagingserver",
    storageBucket: "tippaneemessagingserver.appspot.com",
    messagingSenderId: "931857946140"
};
firebase.initializeApp(config);

function initApp() {
    // Listen for auth state changes.
    firebase.auth().onAuthStateChanged(function (user) {
        //console.log('User state change detected from the Background script of the Chrome Extension:', user);
        try {
            userName = user.email;
        } catch (e) {
            userName = null;
        }
    });
}

window.onload = function () {
    initApp();
};

function userLoginChanged(tabId, lgData) {
    var tempAuthState = false;
    var auth = firebase.auth();
    var promise;

    var mode = lgData.md;
    var email, pass;

    switch (mode) {
        case "btnLogIn":
            email = lgData.el;
            pass = lgData.pw;
            promise = auth.signInWithEmailAndPassword(email, pass);
            break;
        case "btnSignUp":
            email = lgData.el;
            pass = lgData.pw;
            promise = auth.createUserWithEmailAndPassword(email, pass);
            break;

        case "btnLogOut":
            firebase.auth().signOut();
            break;
        default:
            //do nothing
    }

    try {
        promise.catch(function (e) {
            var msg = {};
            msg.type = "auth-screen-alert";
            msg.alertErr = e.code;
            chrome.tabs.sendMessage(tabId, msg);
        });
    } catch (e) {
        //do nothing
    }

    // On authentication state change
    firebase.auth().onAuthStateChanged(function (firebaseUser) {
        var msg = {};
        try {
            msg.user = firebaseUser.email;
            userName = firebaseUser.email;
        } catch (e) {
            msg.user = null;
            userName = null;
        }

        msg.mode = mode;

        if (firebaseUser) {
            //console.log('logged in');
            tempAuthState = true;
            msg.type = "user-in";
            chrome.tabs.sendMessage(tabId, msg);
        } else {
            //console.log('not logged in');
            if (tempAuthState) {
                tempAuthState = false;
                msg.type = "user-not-in";
                chrome.tabs.sendMessage(tabId, msg);
            } else {
                msg.type = "set-local-anno";
                chrome.tabs.sendMessage(tabId, msg);
            }
        }
    });
}

function serverDataChanged(tabId, lgData) {
    var data = {};
    var grpId;
    var userId = firebase.auth().currentUser.uid;
    switch (lgData.msg) {
        case "getData":
            annoData = {};
            grpData = [];
            getAnnoData(tabId);
            break;

        case "setData":
            annoData[lgData.key] = lgData.val;
            switch (lgData.shrdWth) {
                case "Private":
                    data = {};
                    data[lgData.key] = lgData.val;
                    firebase.database().ref('users/' + userId + '/annotations').update(data);
                    break;

                default:
                    firebase.database().ref('groupNames/' + lgData.shrdWth).once('value').then(function (snapshot) {
                        grpId = snapshot.val();
                        data = {};
                        data[lgData.key] = lgData.val;
                        firebase.database().ref('groups/' + grpId + '/annotations').update(data);
                    });
                    break;
            }
            break;

        case "remData":
            annoData[lgData.key] = lgData.val;
            switch (lgData.shrdWth) {
                case "Private":
                    data = {};
                    data[lgData.key] = lgData.val;
                    firebase.database().ref('users/' + userId + '/annotations').update(data);
                    break;

                default:
                    firebase.database().ref('groupNames/' + lgData.shrdWth).once('value').then(function (snapshot) {
                        grpId = snapshot.val();
                        data = {};
                        data[lgData.key] = {};
                        firebase.database().ref('groups/' + grpId + '/annotations').update(data);
                    });
                    break;
            }
            break;

        case "chngAnnoGrp":
            var tt = "";
            if (lgData.oldgrp == "Private") {
                tt = tt.concat("0");
                if (lgData.newgrp == "Private") {
                    tt = tt.concat("0");
                } else {
                    tt = tt.concat("1");
                }
            } else {
                tt = tt.concat("1");
                if (lgData.newgrp == "Private") {
                    tt = tt.concat("0");
                } else {
                    tt = tt.concat("1");
                }
            }
            switch (tt) {
                case "01":
                    firebase.database().ref('groupNames/' + lgData.newgrp).once('value').then(function (snapshot) {
                        grpId = snapshot.val();
                        data = {};
                        data[lgData.key] = lgData.val;
                        firebase.database().ref('groups/' + grpId + '/annotations').update(data);
                    });

                    data = {};
                    data[lgData.key] = {};
                    firebase.database().ref('users/' + userId + '/annotations').update(data);
                    break;
                case "10":
                    data = {};
                    data[lgData.key] = lgData.val;
                    firebase.database().ref('users/' + userId + '/annotations').update(data);

                    firebase.database().ref('groupNames/' + lgData.oldgrp).once('value').then(function (snapshot) {
                        grpId = snapshot.val();
                        data = {};
                        data[lgData.key] = {};
                        firebase.database().ref('groups/' + grpId + '/annotations').update(data);
                    });
                    break;
                case "11":
                    firebase.database().ref('groupNames/' + lgData.newgrp).once('value').then(function (snapshot) {
                        grpId = snapshot.val();
                        data = {};
                        data[lgData.key] = lgData.val;
                        firebase.database().ref('groups/' + grpId + '/annotations').update(data);
                    });

                    firebase.database().ref('groupNames/' + lgData.oldgrp).once('value').then(function (snapshot) {
                        grpId = snapshot.val();
                        data = {};
                        data[lgData.key] = {};
                        firebase.database().ref('groups/' + grpId + '/annotations').update(data);
                    });
                    break;
                default:
                    // do nothing
                    break;
            }
            break;

        default:
            break;
    }
}

function getAnnoData(tabId) {
    var userId = firebase.auth().currentUser.uid;
    var prm = new Promise(function (resolve, reject) {
        firebase.database().ref('users/' + userId).child('memberOf').once('value').then(function (snapshot) {
            var grup = snapshot.val();
            if (grup !== null) {
                grpData = [];
                Object.keys(grup).forEach(function (ky) {
                    grpData.push(grup[ky]);
                    firebase.database().ref('groups/' + ky).child('annotations').once('value').then(function (snapshot) {
                        if (snapshot.val() !== null) {
                            Object.keys(snapshot.val()).forEach(function (ky) {
                                annoData[ky] = snapshot.val()[ky];
                            });
                        }
                    });
                });
            }
            firebase.database().ref('users/' + userId).child('annotations').once('value').then(function (snapshot) {
                if (snapshot.val() !== null) {
                    Object.keys(snapshot.val()).forEach(function (ky) {
                        annoData[ky] = snapshot.val()[ky];
                    });
                }
                resolve();
            });
        });
    });

    prm.then(function (value) {
        var msg = {};
        msg.type = "set-server-anno";
        msg.data = annoData;
        msg.grp = grpData;
        chrome.tabs.sendMessage(tabId, msg);
    });
}
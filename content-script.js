// Declare local variables
var allnotes = {};
var aNotesonpage = {};
var oNotesonpage = {};
var loaded = false;
var wselectedanchor = {};
var wselectedtext;
var wselectedelement;

// Fetch data from storage and save into local variable 'allnotes'
getData(null, function (items) {
    for (var key in items) {
        if (key.substring(0, 3) === "ww-") {
            allnotes[key] = items[key];
        }
    }
    console.log("Available Notes:" + Object.keys(allnotes).length);
});

// Stop HREFs from re-directing on note-dom click events
$("a").on("click", function (e) {
    if ($(".note-dom").find(e.target).length !== 0 || $("#wtarget").hasClass("wlight")) {
        e.preventDefault();
    }
});

// Listener function will be called when a tab is updated
chrome.runtime.onMessage.addListener(function (msg, sender) {
    if (msg === "clear-tipp") { // Request to clear Tippanee
        $("body").children("#weaver-bubble").remove(); // Remove Tippanee bubble
        $("body").children("#weaver-dash").remove(); // Remove Tippanee dash

        // Remove highlighted annotations
        Object.keys(aNotesonpage).forEach(function (key) {
            $("." + key + ".el-highlight").removeClass("el-highlight").removeClass(key);
        });

        var data = {
            text: "" // NULLify annotation count
        };

        chrome.runtime.sendMessage({ // Send message to background.js
            type: "updateBadge",
            data: data
        });
    }

    if (msg === "render-tipp") { // Request to render Tippanee
        addBubble(function () {
            renderDash();
        });
        // Adds Tippanee bubble into webpage DOM 'THEN'
        // Adds Tippanee dash into webpage DOM
    }
});

// Listener function will be called when a tab is updated
chrome.runtime.onMessage.addListener(function (msg, sender) {
    if (msg === "tab-actvtd") {
        calcAnnCntOnPg();
        //console.log("Tab Activated");
    }
});

// Counts the number of annotations on page
function calcAnnCntOnPg() {
    var annoCount = Object.keys(aNotesonpage).length + Object.keys(oNotesonpage).length; // Calculate annotation count

    if (annoCount === 0) {
        annoCount = "";
    } // NULLify if annotation count is ZERO

    var data = {
        text: annoCount.toString() // Pass annotation count
    };

    chrome.runtime.sendMessage({ // Send message to background.js
        type: "updateBadge",
        data: data
    });
}


// Bubble Functions///////////////////////////////////////////////////////////////////////////////
// Add bubble to website DOM
function addBubble(callback) {
    // Add bubble to the top of the page.
    var $bubbleDOM = $("<div id='weaver-bubble'><div id='weaver32' title='Add to WebWeaver'></div></div>");
    $("body").append($bubbleDOM);

    // Listens to mouseup DOM events.
    $(document).mouseup(function (e) {
        showBubble(e);
    });

    // Listens to mouseup DOM events.
    $(document).mousedown(function () {
        hideBubble();
    });

    // Listen to bubble click.
    $("#weaver-bubble").off("click").on("click", function () {
        bubbleClick(wselectedelement);
    });

    callback();
}

// Hide bubble
function hideBubble() {
    if (!$("#weaver-bubble").is(":hover")) {
        $("#weaver-bubble").css("visibility", "hidden");
        try {
            document.getSelection().removeAllRanges();
        } catch (err) {
            console.log(err);
        }
    }
}

// Show bubble
function showBubble(elem) {
    var wselection = document.getSelection();
    if (wselection.type === "Range" && wselection.toString() !== "") {
        renderBubble(wselection, elem.pageX, elem.pageY);
    }
}

// Move bubble to appropriate location.
function renderBubble(wselection, X, Y) {
    var backwards = false;

    if (!wselection.isCollapsed) { // Check if text selection was backwards
        var range = document.createRange();
        range.setStart(wselection.anchorNode, wselection.anchorOffset);
        range.setEnd(wselection.focusNode, wselection.focusOffset);
        backwards = range.collapsed;
    }

    if (backwards) { // If text selection was backwards
        wselectedanchor.startNode = wselection.focusNode.nodeValue;
        wselectedanchor.startOffset = wselection.focusOffset;
        wselectedanchor.endNode = wselection.anchorNode.nodeValue;
    } else { // If text selection was forward
        wselectedanchor.startNode = wselection.anchorNode.nodeValue;
        wselectedanchor.startOffset = wselection.anchorOffset;
        wselectedanchor.endNode = wselection.focusNode.nodeValue;
    }

    if (wselection.anchorNode === wselection.focusNode) {
        wselectedanchor.oneNode = true;
        if (backwards) {
            wselectedanchor.endOffset = wselection.anchorNode.nodeValue.length - wselection.anchorOffset;
        } else {
            wselectedanchor.endOffset = wselection.focusNode.nodeValue.length - wselection.focusOffset;
        }
    } else {
        wselectedanchor.oneNode = false;
        if (backwards) {
            wselectedanchor.endOffset = wselection.anchorOffset;
        } else {
            wselectedanchor.endOffset = wselection.focusOffset;
        }
    }

    wselectedelement = wselection.getRangeAt(0).commonAncestorContainer;
    wselectedtext = wselection.toString();
    if (!wselectedelement.tagName) {
        wselectedelement = wselectedelement.parentElement;
    }
    $("#weaver-bubble").css("left", X + 20 + "px");
    $("#weaver-bubble").css("top", Y + 20 + "px");
    $("#weaver-bubble").css("visibility", "visible");
}

// Bubble click event
function bubbleClick(elem) {
    hideBubble();
    $("#weaver-bubble").css("visibility", "hidden");
    renderNewNote(elem);
}


// Dashboard Functions////////////////////////////////////////////////////////////////////////////
// Renders the Tippanee dashboard
function renderDash() {

    if (loaded === false) {
        loaded = true;

        $("body").children("#weaver-dash").remove(); // Remove Tippanee dash
        $("body").append($.templates.dashDOM.render());

        // Event button for arrow button on dashboard
        $("#warrow").on("click", function () {
            $("#warrow").toggleClass('ww-angle-right ww-angle-left');
            $("#weaver-dash").toggleClass('weaver-dash-max weaver-dash-min');
            //$("#weaver-toolbar").toggle();
        });

        // Event button for web of data on dashboard
        $("#wwebodata").on("click", function () {
            $("#wwebodata").toggleClass('wlight wdark');
            renderWebodata();
        });

        // Event button for target on dashboard
        $("#wtarget").on("click", function () {
            $("#wtarget").toggleClass('wlight wdark');
            targetElement();
        });

        // Event button for search on dashboard
        $("#wsearch").on("click", function () {
            $("#wsearch").toggleClass('wlight wdark');
            if ($("#weaverSrcBar").css("visibility") === 'hidden') { // If search bar is hidden
                $("#weaverSrcBar").css("visibility", "visible"); // Change visibility of search bar to visible
                $("#weaverSrcBar").focus(); // Focus on search bar
            } else { // If search bar is visible
                $("#weaverSrcBar").css("visibility", "hidden"); // Change visibility of search bar to hidden
                $("#weaverSrcBar")[0].value = ''; // NULLify search bar value


                var selTabValue = $(".wtablinks.active")[0].id;

                if (selTabValue === "wanchTab") {
                    $.each($(".note-dom"), function (index, value) {
                        $("#" + value.id + ".note-dom").show();
                    });
                } else if (selTabValue === "wbrowTab") {
                    $.each($(".browser-container"), function (index, value) {
                        $("#" + value.id + ".browser-container").show();
                    });
                }
            }
        });

        // Event keypress for search bar on dashboard
        $("#weaverSrcBar").keypress(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault(); // Prevents 'enter' from being registered
                //alert("Searching for " + $("#weaverSrcBar")[0].value);

                var selTabValue = $(".wtablinks.active")[0].id;

                if (selTabValue === "wanchTab") {
                    srcOptAt(); // Search output for anchor tab
                } else if (selTabValue === "wbrowTab") {
                    srcOptBt(); // Search output for archive tab
                }
            }
        });

        // Generate search output for anchor tab
        function srcOptAt() {
            var srcTxt = $("#weaverSrcBar")[0].value.toUpperCase();
            var inrTxt = "";
            $.each($(".note-dom"), function (index, value) {
                inrTxt = $("#" + value.id + ".note-dom").text().toUpperCase();

                if (inrTxt.includes(srcTxt) === false) {
                    $("#" + value.id + ".note-dom").hide();
                } else {
                    $("#" + value.id + ".note-dom").show();
                }
            });
        }

        // Generate search output for archive tab
        function srcOptBt() {
            var srcTxt = $("#weaverSrcBar")[0].value.toUpperCase();
            var inrTxt = "";
            $.each($(".browser-container"), function (index, value) {
                inrTxt = $("#" + value.id + ".browser-container").text().toUpperCase();

                if (inrTxt.includes(srcTxt) === false) {
                    $("#" + value.id + ".browser-container").hide();
                } else {
                    $("#" + value.id + ".browser-container").show();
                }
            });
        }

        // Event for Annotations tab
        $("#wanchTab").on("click", function () {
            wopenTab(event, 'wanchs');
            renderOldNotes();

            if ($("#weaverSrcBar").css("visibility") === 'visible') {
                $("#wsearch").trigger("click");
            }
        });

        // Event for Archives tab
        $("#wbrowTab").on("click", function () {
            wopenTab(event, 'wbrows');
            renderBrowTab();

            if ($("#weaverSrcBar").css("visibility") === 'visible') {
                $("#wsearch").trigger("click");
            }
        });

        // Event for Descriptors tab
        $("#wsemanTab").on("click", function () {
            wopenTab(event, 'wsemans');
            renderSemanTab();

            if ($("#weaverSrcBar").css("visibility") === 'visible') {
                $("#wsearch").trigger("click");
            }
        });

        // Event when tabs (Annotations/Archives/Descriptors) are switched
        function wopenTab(evt, wtabName) {
            var i, wtabcontents, wtablinks;
            wtabcontents = document.getElementsByClassName("wtabcontents");
            for (i = 0; i < wtabcontents.length; i++) {
                wtabcontents[i].style.display = "none";
            }
            wtablinks = document.getElementsByClassName("wtablinks");
            for (i = 0; i < wtablinks.length; i++) {
                wtablinks[i].className = wtablinks[i].className.replace(" active", "");
            }
            document.getElementById(wtabName).style.display = "block";
            if (typeof evt == 'undefined') {
                $("#wanchTab").addClass("active");
            } else
                evt.currentTarget.className += " active";
        }

        $("#wanchTab").trigger("click"); // Trigger Annotations tab
        $("#warrow").trigger("click"); // Trigger arrow button
    }
}

// Renders Old Notes
function renderOldNotes() {
    //console.log("renderOldNotes Start!");
    $("#wanchs.wtabcontents").empty();
    for (var key in allnotes) {
        var tempUrl = allnotes[key].urlProtocol + "//" + allnotes[key].urlHost + allnotes[key].urlPathname + allnotes[key].urlParameter; //URL of Notes
        if (tempUrl === window.location.href) { //Check if Note URLs are same as current DOM

            //console.log(allnotes[key]);

            var anr = allnotes[key].anchor; //Notes previously saved on URL 
            var anrlen = anr.length; //Number of notes saved on URL
            var wpg = []; //Array to save DOM nodes
            var iden;

            if (anr[0].id) {
                //iden = anr[0].nodeName + "#" + anr[0].id;
                //wpg = $(iden);
                wpg = document.getElementById(anr[0].id); //Check Anchor--DOM node's ID
            } else if (anr[0].className) {
                // iden = anr[0].nodeName + "." + anr[0].className;
                // wpg = $(iden);
                wpg = document.getElementsByClassName(anr[0].className); //Check Anchor--DOM node's className
            } else if (anr[0].nodeName) {
                // iden = anr[0].nodeName;
                // wpg = $(iden);
                wpg = document.getElementsByTagName(anr[0].nodeName); //Check Anchor--DOM node's nodeName
            }

            if (!wpg.length) { //Coverts single DOM node to array
                wpg = new Array(wpg);
            }

            var lim = wpg.length; //Number of DOM nodes
            var mat = [];
            var mis = [];

            //console.log("Anchor: ", anr);

            var i;

            for (i = 0; i < lim; i++) { //Repeat for all DOM nodes
                var tempanr = JSON.parse(JSON.stringify(anr)); //tempanr saves instance on Anchor node

                mat.push(0); //Initialize zero 'matches'
                mis.push(0); //Initialize zero 'mis-matches'

                if (!wpg.length) {
                    jsonCompare(wpg); //Pass selected DOM node to 'jsonCompare'
                    //console.log("Current DOM: ", wpg);
                } else {
                    jsonCompare(wpg[i]); //Pass selected DOM node to 'jsonCompare'
                    //console.log("Current DOM: ", wpg[i]);
                }
                if (mat[i] === anrlen && mis[i] === 0) { //Check if DOM node & Anchor node are exactly same
                    break;
                }
            }

            var strvarKey;
            var strvarData = {};


            strvarKey = tempUrl.toString() + "--" + key.toString();

            // TEST DATA
            strvarData["MAT"] = mat;

            // TEST DATA
            strvarData["MIS"] = mis;

            // Compare Anchored Nodes to DOM Nodes
            function jsonCompare(node) {
                if (node.nodeName !== "HEAD" && node.nodeName !== "SCRIPT" && node.nodeName !== "NOSCRIPT" && node.nodeType !== 8 && node.nodeType !== 10) { //Ignore if node is 'HEAD, SCRIPT or other unusable types'
                    var j;
                    for (j = 0; j < tempanr.length; j++) { //Repeat for all elements in Anchor node
                        var kvp = Object.keys(tempanr[j]);

                        if (tempanr[j].nodeName !== '#text' && node.nodeName !== '#text') { //Match 'non-text' elements
                            var fnd = 0;
                            for (var k = 0; k < kvp.length; k++) { //Repeat for all properties of Anchor node elements
                                if (kvp[k] !== 'nodeDepth') {

                                    if (kvp[k] === 'classList') {
                                        var clcnt = 0;
                                        var tmpcl = [];

                                        try {
                                            if (node[kvp[k]].length > 0) {
                                                var idx = 0;
                                                node[kvp[k]].forEach(function (dat, indx) {
                                                    if (node[kvp[k]][indx] !== "el-highlight" && node[kvp[k]][indx].substring(0, 3) !== "ww-") {
                                                        tmpcl[idx] = node[kvp[k]][indx];
                                                        idx++;
                                                    }
                                                });
                                            }
                                        } catch (err) {}

                                        tempanr[j][kvp[k]].forEach(function (dat) {

                                            var fnd = tmpcl.find(function (val) {
                                                return val === dat;
                                            });

                                            if (fnd != null) {
                                                clcnt++;
                                            }

                                        });

                                        if (clcnt === tempanr[j][kvp[k]].length) {
                                            fnd = fnd + 1 / (kvp.length - 1);
                                        }
                                    } else {
                                        if (node[kvp[k]] === tempanr[j][kvp[k]]) {
                                            fnd = fnd + 1 / (kvp.length - 1);
                                        }
                                    }
                                }
                            }

                            if (fnd === 1) { //If all properties match
                                mat[i] = (mat[i] * 100 + 1 * 100) / 100;
                                tempanr.splice(j, 1); //Remove match element from Anchor node instance
                                break;
                            } else { //If some properties dont match
                                fnd = fnd.toFixed(2); //Round value to second decimal place
                                mis[i] = (mis[i] * 100 + (1 - fnd) * 100) / 100;
                            }
                        }

                        if (tempanr[j].nodeName === '#text' && node.nodeName === '#text') { //Match 'text' elements
                            var fuzsim;
                            if (tempanr[j].nodeValue === node.nodeValue) { //If all contents match
                                mat[i] = (mat[i] * 100 + 1 * 100) / 100;
                                tempanr.splice(j, 1); //Remove match content from Anchor node instance
                                break;
                            } else { //If some contents dont match
                                try {
                                    var fuzcon = FuzzySet([tempanr[j].nodeValue], useLevenshtein = true); //FUZZY TEXT MATCHING
                                    if (fuzcon.get(node.nodeValue)) {
                                        fuzsim = (fuzcon.get(node.nodeValue)[0][0]).toFixed(2); //Round value to second decimal place
                                    } else {
                                        fuzsim = 0;
                                    }

                                    if (fuzsim >= 0.5) { //If more than 50% contents match
                                        mat[i] = (mat[i] * 100 + fuzsim * 100) / 100;
                                        tempanr.splice(j, 1); //Remove match content from Anchor node instance
                                        break;
                                    } else { //If less than 50% contents match
                                        mis[i] = (mis[i] * 100 + (1 - fuzsim) * 100) / 100;
                                    }
                                } catch (err) {}

                            }
                        }
                    }

                    var iframeNodes = (node.contentWindow || node.contentDocument);
                    var childNodes = node.childNodes;
                    if (iframeNodes) {
                        try {
                            childNodes = iframeNodes.document.childNodes;
                        } catch (e) {
                            console.log(e);
                        }

                    }
                    if (childNodes.length > 0) {
                        var length = childNodes.length;
                        for (j = 0; j < length; j++) {
                            jsonCompare(childNodes[j]);
                        }
                    }
                }
            }

            var note = allnotes[key];
            var notekey = key;

            var arrMAXmat = [];

            mat.forEach(function (dat, indx) {
                arrMAXmat.push(0.75 * mat[indx] - 0.25 * mis[indx]);
            });

            var iMAXmat = arrMAXmat.indexOf(Math.max.apply(Math, arrMAXmat));

            if (mat[iMAXmat] / anr.length >= 0.7) {

                var elem = wpg[iMAXmat];

                aNotesonpage[notekey] = elem;

                var $noteDOM = $("<div id='" + notekey + "' class='note-dom'></div></div>");
                $("#wanchs").prepend($noteDOM);
                $("#" + notekey + ".note-dom").append($.templates.weaverNote.render(note));

                $("#" + notekey + ".note-dom").children(".weaver-container").append("<div id='sim-index' class='weaver-header' style='text-align: left !important;'>Similarity Index: " + parseFloat(Math.round(mat[iMAXmat] / anr.length * 100) / 100).toFixed(2) + "</div>");

                // TEST DATA
                strvarData["iMAXmat"] = iMAXmat;

                // STORING TEST DATA
                strvarData["simIndex"] = mat[iMAXmat] / anr.length;
                storeData(strvarKey, strvarData);

                var arr = $.map(note.oldnotes, function (value, key) {
                    return [
                        [key, value]
                    ];
                });

                for (i = 0; i < arr.length; i++) {
                    var $commentDOM = $("<div id='" + arr[i][0] + "' class='nhtext'>" + arr[i][1] + "<br><i style='font-size: 8px;'>" + moment(arr[i][0]).format('lll') + "</i>" + "<b id='eraser' class='ww ww-times' aria-hidden='true' title='Delete Comment'></b> </div>");
                    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-old-comments").css("display", "inline-block").append($commentDOM);
                }

                if (mat[iMAXmat] / anr.length === 1) {
                    highlightAnchor(elem, notekey, "dup");
                } else {
                    highlightAnchor(elem, notekey, "dif");
                }

                $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-anno").css("cursor", "pointer");

                // Click event
                $(document).on("click", ".weaver-anno", glower);

                // Click event for descriptor
                $(document).on("click", "#descriptor", descriptor);
                // Click event for transcludor
                $(document).on("click", "#transcludor", transcludor);
                // Click event for linker
                $(document).on("click", "#linker", linker);
                // Click event for reconstructor
                $(document).on("click", "#reconstructor", reconstructor);
                // Click event for deleter
                $(document).on("click", "#deleter", deleter);
                // Click event for eraser
                $(document).on("click", "#eraser", eraser);
                // Keyup event for weaver comment
                $(document).off("keyup").on("keyup", ".weaver-new-comments", newComment);
            } else {

                oNotesonpage[notekey] = null;

                // TEST DATA
                strvarData["iMAXmat"] = iMAXmat;

                // STORING TEST DATA
                strvarData["simIndex"] = mat[iMAXmat] / anr.length;
                storeData(strvarKey, strvarData);

                var $noteDOM = $("<div id='" + notekey + "' class='note-dom'></div></div>");
                $("#wanchs").append($noteDOM);
                $("#" + notekey + ".note-dom").append($.templates["o-weaverNote"].render(note));

                $("#" + notekey + ".note-dom").children(".weaver-container").append("<div id='sim-index' class='weaver-header' style='text-align: left !important;'>Orphan!</div>");

                var arr = $.map(note.oldnotes, function (value, key) {
                    return [
                        [key, value]
                    ];
                });

                for (i = 0; i < arr.length; i++) {
                    var $commentDOM = $("<div id='" + arr[i][0] + "' class='nhtext'>" + arr[i][1] + "<br><i style='font-size: 8px;'>" + moment(arr[i][0]).format('lll') + "</i>" + "<b id='eraser' class='ww ww-times' aria-hidden='true' title='Delete Comment'></b> </div>");
                    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-old-comments").css("display", "inline-block").append($commentDOM);
                }

                // Click event for descriptor
                $(document).on("click", "#descriptor", descriptor);
                // Click event for linker
                $(document).on("click", "#linker", linker);
                // Click event for reconstructor
                $(document).on("click", "#reconstructor", reconstructor);
                // Click event for deleter
                $(document).on("click", "#deleter", deleter);
                // Click event for eraser
                $(document).on("click", "#eraser", eraser);
                // Keyup event for weaver comment
                $(document).off("keyup").on("keyup", ".weaver-new-comments", newComment);
            }
        }
    }

    // $.holdReady( true );
    //console.log("renderOldNotes Complete!");

    //calcAnnCntOnPg();
}

// Renders Browser Tab
function renderBrowTab() {
    $("#wbrows.wtabcontents").empty();
    $.each(allnotes, function (notekey) {
        $("#wbrows.wtabcontents").prepend("<div id=" + notekey + " class='browser-container'></div>");
        $("#" + notekey + ".browser-container").append($.templates.browserNote.render(allnotes[notekey]));

        $("#" + notekey + ".browser-container").click(function () {

            var tempUrl = allnotes[notekey].urlProtocol + "//" + allnotes[notekey].urlHost + allnotes[notekey].urlPathname + allnotes[notekey].urlParameter;

            window.open(tempUrl);
        });

        Object.keys(allnotes[notekey].oldnotes).forEach(
            function (key) {
                var k = key;
                var v = allnotes[notekey].oldnotes[k];
                var $browserComment = $("<div id='" + k + "' class='nhtext'>" + v + "<br><i style='font-size: 8px;'>" + moment(k).format('lll') + "</i>" + "</div>");
                $("#" + notekey + ".browser-container").children(".browser-old-comments").append($browserComment);
            });
    });
}

// Renders Semantics Tab
function renderSemanTab() {
    $("#wsemans.wtabcontents").empty();
}

// Target Element
function targetElement() {
    var flag = false;

    $('body').children().mouseout(function (el) {
        $(el.target).removeClass("trg-highlight");
    }).mouseover(function (el) {
        if (document.getElementById('weaver-dash') !== el.target && !$.contains(document.getElementById('weaver-dash'), el.target)) {
            $(el.target).addClass("trg-highlight");
            $(el.target).one("click", function (event) {
                if (flag == false) {
                    $(el.target).removeClass("trg-highlight");
                    //console.log(el.target);

                    var wrange = document.createRange();

                    var strEl = el.target;
                    var endEl = el.target;

                    while (strEl.childNodes[0].nodeValue === null) {
                        strEl = strEl.childNodes[0];
                    }
                    var wstartNode = strEl.firstChild;
                    var wstartOffset = 0;
                    wrange.setStart(wstartNode, wstartOffset);

                    var wendNode = endEl.lastChild;
                    var wendOffset;
                    if (wendNode.nodeName === "#text") {
                        wendOffset = wendNode.textContent.length;
                    } else {
                        wendOffset = endNode.childNodes.length;
                    }

                    wrange.setEnd(wendNode, wendOffset);

                    var wselection = window.getSelection();
                    wselection.removeAllRanges();
                    wselection.addRange(wrange);

                    renderBubble(wselection, el.pageX, el.pageY);

                    flag = true;
                    $('body').children().off("mouseout");
                    $('body').children().off("mouseover");
                    $("#wtarget").toggleClass('wlight wdark');
                }
            });
        }
    });
}

// Renders WebOfData Tab
function renderWebodata() {
    //var srcTxt = $("#weaverSrcBar")[0].value.toUpperCase();
    //var inrTxt;

    $("body").children("#weaver-overlay").remove();

    var webodNodes = [];
    var webodEdges = [];
    var webodNodeUrl = [];
    var nodeArr = $.map(allnotes, function (value, key) {
        return key;
    });

    var nodeUrl = $.map(allnotes, function (value) {
        return value.urlHost;
    });

    Array.prototype.unique = function () {
        var arr = [];
        for (var i = 0; i < this.length; i++) {
            if (!arr.includes(this[i])) {
                arr.push(this[i]);
            }
        }
        return arr;
    };

    var urlGroup = nodeUrl.unique();

    nodeArr.forEach(
        function (nodeElem) {
            //alert(key);
            //inrTxt = "";
            var tempUrl = allnotes[nodeElem].urlProtocol + "//" + allnotes[nodeElem].urlHost + allnotes[nodeElem].urlPathname + allnotes[nodeElem].urlParameter;
            //inrTxt = (tempUrl + " " + allnotes[nodeElem].addedon + " " + allnotes[nodeElem].selectedtext).toUpperCase();
            var edgeArr = allnotes[nodeElem].links;

            var webodNodeElement = {};
            webodNodeElement.id = nodeArr.indexOf(nodeElem);

            //console.log(webodNodeElement.id);
            webodNodeUrl.push(tempUrl);

            webodNodeElement.value = Object.keys(allnotes[nodeElem].oldnotes).length;
            webodNodeElement.group = urlGroup.indexOf(allnotes[nodeElem].urlHost);
            webodNodeElement.label = allnotes[nodeElem].urlHost;
            webodNodeElement.title = "<i style='float: right;'>" + allnotes[nodeElem].addedon + "</i><br/><br/>" + allnotes[nodeElem].selectedtext + "<br/><br/><i style='float: right; text-algin: justify; word-break: break-all;'> <b>URL: </b>" + tempUrl + "</i>";
            webodNodes.push(webodNodeElement);

            edgeArr.forEach(
                function (edgeElem) {
                    //alert(key);
                    var webodEdgeElement = {};
                    webodEdgeElement.from = nodeArr.indexOf(nodeElem);
                    webodEdgeElement.to = nodeArr.indexOf(edgeElem);
                    webodEdges.push(webodEdgeElement);
                }
            );
        }
    );

    $("body").append("<div id='weaver-overlay' class='woverlay-hide'><div class='woverlay-content'><span id='woverlay-close'>&times;</span><div id='mywebofdata'></div></div></div>");
    var container = document.getElementById('mywebofdata');
    var data = {
        nodes: webodNodes,
        edges: webodEdges
    };
    var options = {
        layout: {
            randomSeed: undefined,
            improvedLayout: true
        },
        edges: {
            arrows: 'to',
            color: {
                inherit: true
            },
            smooth: {
                enabled: true,
                type: "dynamic",
                roundness: 0.5
            }
        },
        nodes: {
            shape: 'dot',
            size: 10,
            font: {
                size: 10,
                face: 'monospace',
                align: 'center'
            }
        },
    };
    var network = new vis.Network(container, data, options);

    network.on("doubleClick", function (params) {
        params.event = "[original event]";
        var i = this.getNodeAt(params.pointer.DOM);
        if (i >= 0) {
            window.open(webodNodeUrl[i]);
        }
    });

    //alert("END");
    $('#weaver-overlay').toggleClass('woverlay-show woverlay-hide');

    $("#woverlay-close").on("click", function () {
        $("#wwebodata").toggleClass('wlight wdark');
        $("body").children("#weaver-overlay").remove();
    });

    if ($("#weaverSrcBar").css("visibility") === 'visible') {
        $("#wsearch").trigger("click");
    }
}

// Highlights Anchor
function highlightAnchor(helem, hnotekey, stat) {

    if (stat === "dup") {

        //alert("DUPLICATE");

        /*var indx = -1;
        ckDupJson(helem);

        function ckDupJson(nod, ifNod) {

            indx++;
            var anc = allnotes[hnotekey].anchor[indx];

            if (anc.annotated) {
                var options = {};
                options.separateWordSearch = false;
                options.diacritics = false;
                options.debug = false;
                $(nod).mark(anc.nodeValue.substring(anc.startOffset, anc.nodeValue.length - anc.endOffset), options);
            }

            ifNod = (nod.contentWindow || nod.contentDocument);
            var chNod = nod.childNodes;
            if (ifNod) {
                try {
                    chNod = ifNod.document.childNodes;
                } catch (e) {
                    console.log(e);
                }

            }

            if (chNod.length > 0) {
                var ln = chNod.length;
                for (var j = 0; j < ln; j++) {
                    ckDupJson(chNod[j], ifNod);
                }
            }

        }*/

    } else if (stat === "dif") {

        //alert("DIFFERENT");

    }
    $(helem).addClass("el-highlight").addClass(hnotekey);
}

// Note Functions/////////////////////////////////////////////////////////////////////////////////
// Render new note
function renderNewNote(elem) {
    var note = createNewNote();
    var notekey = genNoteKey();

    note.anchor = elemJSON(elem, wselectedanchor);
    var $noteDOM = $("<div id='" + notekey + "' class='note-dom'></div>");
    $("#wanchs").prepend($noteDOM);
    $("#" + notekey + ".note-dom").append($.templates.weaverNote.render(note));

    allnotes[notekey] = note;
    storeData(notekey, note);

    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-new-comments").focus();
    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-anno").css("cursor", "pointer");

    highlightAnchor(elem, notekey, "dup");

    // Click event
    $(document).on("click", ".weaver-anno", glower);

    // Click event for descriptor
    $(document).on("click", "#descriptor", descriptor);
    // Click event for transcludor
    $(document).on("click", "#transcludor", transcludor);
    // Click event for linker
    $(document).on("click", "#linker", linker);
    // Click event for reconstructor
    $(document).on("click", "#reconstructor", reconstructor);
    // Click event for deleter
    $(document).on("click", "#deleter", deleter);
    // Click event for eraser
    $(document).on("click", "#eraser", eraser);
    // Keyup event for weaver comment
    $(document).off("keyup").on("keyup", ".weaver-new-comments", newComment);

    aNotesonpage[notekey] = elem;

    calcAnnCntOnPg();
}

// Descriptor function
function descriptor(event) {
    event.stopImmediatePropagation();
    $(this).toggleClass("active");
    // $(this).next(".weaver-container").toggle(500);
    if ($(this).hasClass("active")) {
        var notekey = $($(this).offsetParent()).offsetParent().attr("id");

        $("#" + notekey + ".note-dom").append($.templates.descriptorContainer.render());

        $("#" + notekey + ".note-dom").find(".old-description").text(JSON.stringify(allnotes[notekey].description));

        $("#" + notekey + ".note-dom").find("#schemathingsdd").change(function (value) {
            $("#" + notekey + ".note-dom").find("#descriptionInput").html("");
            var sel = $("#" + notekey + ".note-dom").find("#schemathingsdd option:selected").text();
            switch (sel) {
                case 'CreativeWork':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates.crwO.render());
                    break;
                case 'Event':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates.eveN.render());
                    break;
                case 'Organization':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates.orgA.render());
                    break;
                case 'Person':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates.perS.render());
                    break;
                case 'Place':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates.plaC.render());
                    break;
                case 'Product':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates.proD.render());
                    break;
            }
        }).change();

        $("#" + notekey + ".note-dom").on("click", "#desadd", desadd);
        $("#" + notekey + ".note-dom").on("click", "#desclear", desclear);

        function desadd(event) {
            var notekey = $($(this).offsetParent()).offsetParent().attr("id");
            allnotes[notekey].description = {};
            allnotes[notekey].description['@context'] = "http://schema.org";

            var sel = $("#" + notekey + ".note-dom").find("#schemathingsdd option:selected").text();
            allnotes[notekey].description['@type'] = sel;

            $("#" + notekey + ".note-dom").find("form#descriptionInput :input").each(function () {
                //console.log(allnotes[notekey]);
                var input = $(this); // This is the jquery object of the input, do what you will

                allnotes[notekey].description[input[0].placeholder] = input[0].value;
            });
            $.when(storeData(notekey, allnotes[notekey])).then($("#" + notekey + ".note-dom").find(".old-description").text(JSON.stringify(allnotes[notekey].description)));
        }

        function desclear(event) {
            var notekey = $($(this).offsetParent()).offsetParent().attr("id");
            allnotes[notekey].description = {};
            $.when(storeData(notekey, allnotes[notekey])).then($("#" + notekey + ".note-dom").find(".old-description").text(JSON.stringify(allnotes[notekey].description)));
        }

    } else {
        $(this).offsetParent().siblings(".descriptor-container").remove();
    }


}

// Highlighter function
function glower(event) {
    event.stopImmediatePropagation();

    var notekey = $($(this).offsetParent()).offsetParent().attr("id");

    try {
        $("." + notekey + ".el-highlight").scrollIntoView();
    } catch (err) {
        console.log("Scroll into view failed!");
    }

    $("." + notekey + ".el-highlight").addClass("el-highlight-glow").removeClass("el-highlight");
    setTimeout(function () {
        $("." + notekey + ".el-highlight-glow").addClass("el-highlight").removeClass("el-highlight-glow");
    }, 2000);
}

//Reconstructor function
function reconstructor(event) {
    event.stopImmediatePropagation();
    $(this).toggleClass("active");

    var notekey = $($(this).offsetParent()).offsetParent().attr("id");

    if ($(this).hasClass("active")) {
        $("body").children("#weaver-overlay").remove();
        $("body").append("<div id='weaver-overlay' class='woverlay-hide'><div class='woverlay-content'><span id='woverlay-close'>&times;</span><div id='recnstrWindow'></div></div></div>");

        var anrElem = allnotes[notekey].anchor; // Pass anchor (that is to be reconstructed) as array
        var recnstrAnchor = '';

        var prnt = [];

        anrElem.forEach(
            function (val) {

                if (val.nodeName === "#text") { // If anchored array element is TEXT
                    if (val.annotated === true) {
                        if (val.startOffset === 0 && val.endOffset === 0) {
                            recnstrAnchor = recnstrAnchor + "<rcweavermark>" + val.nodeValue + "</rcweavermark>";
                        } else {
                            recnstrAnchor = recnstrAnchor + val.nodeValue.substring(0, val.startOffset) + "<rcweavermark>" + val.nodeValue.substring(val.startOffset, val.nodeValue.length - val.endOffset) + "</rcweavermark>" + val.nodeValue.substring(val.nodeValue.length - val.endOffset);
                        }
                    } else {
                        recnstrAnchor = recnstrAnchor + val.nodeValue;
                    }
                } else { // If anchored array element is NOT TEXT
                    recnstrAnchor = recnstrAnchor + "<" + val.nodeName;
                    if (val.id) {
                        recnstrAnchor = recnstrAnchor + " id='" + val.id + "'";
                    }
                    if (val.className) {
                        recnstrAnchor = recnstrAnchor + " class='" + val.className + "'";
                    }
                    if (val.alt) {
                        recnstrAnchor = recnstrAnchor + " alt='" + val.alt + "'";
                    }
                    if (val.href) {
                        recnstrAnchor = recnstrAnchor + " href='" + val.href + "'";
                    }
                    if (val.src) {
                        recnstrAnchor = recnstrAnchor + " src='" + val.src + "'";
                    }
                    recnstrAnchor = recnstrAnchor + ">";
                }

                if (anrElem.indexOf(val) < anrElem.length - 1) {
                    if (val.nodeDepth < anrElem[anrElem.indexOf(val) + 1].nodeDepth) {
                        prnt.push(val.nodeName);
                    } else {
                        if (val.nodeName !== "#text") {
                            recnstrAnchor = recnstrAnchor + "</" + val.nodeName + ">";
                        }
                        if (val.nodeDepth > anrElem[anrElem.indexOf(val) + 1].nodeDepth) {

                            var d = val.nodeDepth - anrElem[anrElem.indexOf(val) + 1].nodeDepth;
                            for (; d > 0; d--) {
                                recnstrAnchor = recnstrAnchor + "</" + prnt[prnt.length - 1] + ">";
                                prnt.splice(prnt.length - 1, 1);
                            }
                        }
                    }
                } else {
                    if (val.nodeName !== "#text") {
                        recnstrAnchor = recnstrAnchor + "</" + val.nodeName + ">";
                    }
                    while (prnt.length > 0) {
                        recnstrAnchor = recnstrAnchor + "</" + prnt[prnt.length - 1] + ">";
                        prnt.splice(prnt.length - 1, 1);
                    }
                }
            }
        );

        $("#recnstrWindow").append(recnstrAnchor);
        //console.log(recnstrAnchor);
        $('#weaver-overlay').toggleClass('woverlay-show woverlay-hide');

        $("#woverlay-close").on("click", function () {
            $("#" + notekey + ".note-dom").find("#reconstructor").toggleClass("active");
            $("body").children("#weaver-overlay").remove();
        });

    }
}

// Linker function
function linker(event) {
    event.stopImmediatePropagation();
    var notekey = $($(this).offsetParent()).offsetParent().attr("id");

    $(this).toggleClass("active");
    if ($(this).hasClass("active")) {
        var $linkerContainer = $("<div class='linker-container'> <div class='weaver-header'>Link Note</div> <div id='linkerSrcTool'><textarea id='linkerSrcBar' placeholder='Search'></textarea><div id='clrLSrcBar' class='ww ww-times lbutton' title='Clear Search'></div></div> </div>");
        $("#" + notekey + ".note-dom").append($($linkerContainer));

        if (Object.keys(allnotes).length <= 1) {
            $("#" + notekey + ".note-dom").children(".linker-container").append("<div id='noan'>no linkable annotations</div>");
        } else {
            $("#" + notekey + ".note-dom").find("#noan").remove();
            $("#" + notekey + ".note-dom").find(".linker-container").append("<div class='linker-content'></div>");
            $.each(allnotes, function (key) {
                if (notekey !== key) {
                    //alert(key);
                    if (allnotes[notekey].links.indexOf(key) === -1) {
                        $("#" + notekey + ".note-dom").find(".linker-content").append("<div id=" + key + " class='linker-links'></div>");
                        $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").append($.templates.weaverLink.render(allnotes[key]));
                        $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").children(".weaver-options").append("<div id='link-up' class='linker-button ww ww-link' title='Add Link'></div>");
                    } else {
                        $("#" + notekey + ".note-dom").find(".linker-content").prepend("<div id=" + key + " class='linker-links'></div>");
                        $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").append($.templates.weaverLink.render(allnotes[key]));
                        $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").children(".weaver-options").append("<div id='link-up' class='linker-button ww ww-chain-broken' title='Remove Link'></div>");
                    }
                }
            });
        }
    } else {
        $(this).offsetParent().siblings(".linker-container").remove();
    }

    // Event keypress for linker search bar
    $(document).on("keypress", "#linkerSrcBar", linkSrcKyPrs);

    $(document).on("click", "#clrLSrcBar", linkSrcClrBtn);
    $(document).on("click", "#link-up", linkUp);

    $("#" + notekey + ".note-dom").find("#linkerSrcBar").focus();
}

// Linker Search Keypress function
function linkSrcKyPrs(event) {
    if (event.keyCode === 13) {
        event.preventDefault(); // Prevents 'enter' from being registered

        var crnotekey = $($(this).offsetParent()).offsetParent()[0].id;
        var srcTxt = $(this)[0].value.toUpperCase();
        var inrTxt = "";

        $.each($("#" + crnotekey + ".note-dom").find(".linker-links"), function (index, value) {
            inrTxt = $("#" + value.id + ".linker-links").text().toUpperCase();

            if (inrTxt.includes(srcTxt) === false) {
                $("#" + crnotekey + ".note-dom").find("#" + value.id + ".linker-links").hide();
            } else {
                $("#" + crnotekey + ".note-dom").find("#" + value.id + ".linker-links").show();
            }
        });
    }
}

// Clear Linker Search Bar function
function linkSrcClrBtn(event) {
    event.stopImmediatePropagation();
    var crnotekey = $($(this).offsetParent()).offsetParent().attr("id");

    $.each($("#" + crnotekey + ".note-dom").find(".linker-links"), function (index, value) {
        $("#" + crnotekey + ".note-dom").find("#" + value.id + ".linker-links").show();
    });
    $(this).siblings("#linkerSrcBar")[0].value = "";

    $("#" + crnotekey + ".note-dom").find("#linkerSrcBar").focus();
}

// Transcludor function
function transcludor(event) {
    event.stopImmediatePropagation();
    var notekey = $($(this).offsetParent()).offsetParent().attr("id");

    $(this).toggleClass("active");
    if ($(this).hasClass("active")) {
        var $transcludorContainer = $("<div class='transcludor-container'><div class='weaver-header'>Transclude Note</div><div id='transcludorTool'><div id='transView' class='ww ww-eye tbutton' title='View Transclusion' style='float:left!important'></div><div id='transRem' class='ww ww-minus tbutton' title='Remove Transclusion' style='float:right!important'></div><div id='transAdd' class='ww ww-plus tbutton' title='Add Transclusion' style='float:right!important'></div></div></div>");
        $("#" + notekey + ".note-dom").append($($transcludorContainer));

        if (allnotes[notekey].transclusion) {
            var key = allnotes[notekey].transclusion;
            $("#" + notekey + ".note-dom").children(".transcludor-container").append("<div class='transcluded-content'></div>");
            $("#" + notekey + ".note-dom").find(".transcluded-content").append("<div id=" + key + " class='transcludor-links'></div>");
            $("#" + notekey + ".note-dom").find(".transcluded-content").children("#" + key + ".transcludor-links").append($.templates.weaverLink.render(allnotes[key]));

            $("#" + notekey + ".note-dom").children(".transcludor-container").find("#transView").css('visibility', 'visible');
            $("#" + notekey + ".note-dom").children(".transcludor-container").find("#transAdd").css('visibility', 'hidden');
            $("#" + notekey + ".note-dom").children(".transcludor-container").find("#transRem").css('visibility', 'visible');
        } else {
            $("#" + notekey + ".note-dom").children(".transcludor-container").find("#transView").css('visibility', 'hidden');
            $("#" + notekey + ".note-dom").children(".transcludor-container").find("#transAdd").css('visibility', 'visible');
            $("#" + notekey + ".note-dom").children(".transcludor-container").find("#transRem").css('visibility', 'hidden');
        }

    } else {
        var transkey = $(this).offsetParent().siblings(".transcludor-container").find(".transcludor-links").attr("id");
        $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").remove();

        $(this).offsetParent().siblings(".transcludor-container").remove();
    }

    $(document).on("click", "#transAdd", showTransList);
    $(document).on("click", "#transRem", removeTrans);
    $(document).on("click", "#transView", viewTrans);
}

// Show Transclusion List
function showTransList(event) {
    event.stopImmediatePropagation();
    var notekey = $($(this).offsetParent()).offsetParent().attr("id");

    if (!$(this).parent().siblings("#transcludorSrcTool").length) {
        $("#" + notekey + ".note-dom").children(".transcludor-container").append("<div id='transcludorSrcTool'><textarea id='transcludorSrcBar' placeholder='Search'></textarea><div id='clrTSrcBar' class='ww ww-times lbutton' title='Clear Search'></div></div>");

        if (Object.keys(allnotes).length <= 1) {
            $("#" + notekey + ".note-dom").children(".transcludor-container").append("<div id='noan'>no annotations available</div>");
        } else {
            $("#" + notekey + ".note-dom").find("#noan").remove();
            $("#" + notekey + ".note-dom").find(".transcludor-container").append("<div class='transcludor-content'></div>");
            $.each(allnotes, function (key) {
                if (notekey !== key) {
                    //alert(key);
                    $("#" + notekey + ".note-dom").find(".transcludor-content").prepend("<div id=" + key + " class='transcludor-links'></div>");
                    $("#" + notekey + ".note-dom").find("#" + key + ".transcludor-links").append($.templates.weaverLink.render(allnotes[key]));
                    $("#" + notekey + ".note-dom").find("#" + key + ".transcludor-links").children(".weaver-options").append("<div id='trans-up' class='linker-button ww ww-plus' title='Transclude Note'></div>");
                }
            });
        }

    } else {
        $(this).parent().siblings("#transcludorSrcTool").remove();
        $(this).parent().siblings(".transcludor-content").remove();
    }

    // Event keypress for transcludor search bar
    $(document).on("keypress", "#transcludorSrcBar", tranSrcKyPrs);

    $(document).on("click", "#clrTSrcBar", tranSrcClrBtn);
    $(document).on("click", "#trans-up", addTrans);

    $("#" + notekey + ".note-dom").find("#transcludorSrcBar").focus();
}

// Transcludor Search Keypress function
function tranSrcKyPrs(event) {
    if (event.keyCode === 13) {
        event.preventDefault(); // Prevents 'enter' from being registered

        var transkey = $($(this).offsetParent()).offsetParent()[0].id;
        var srcTxt = $(this)[0].value.toUpperCase();
        var inrTxt = "";

        $.each($("#" + transkey + ".note-dom").find(".transcludor-links"), function (index, value) { //$(this).offsetParent()
            inrTxt = $("#" + value.id + ".transcludor-links").text().toUpperCase();

            if (inrTxt.includes(srcTxt) === false) {
                $("#" + transkey + ".note-dom").find("#" + value.id + ".transcludor-links").hide();
            } else {
                $("#" + transkey + ".note-dom").find("#" + value.id + ".transcludor-links").show();
            }
        });
    }
}

// Add Transclusion
function addTrans(event) {
    event.stopImmediatePropagation();
    var transkey = $(this).offsetParent().attr("id");
    var notekey = $($($(this).offsetParent()).offsetParent()).parent().attr("id");

    allnotes[notekey].transclusion = transkey;
    var note = allnotes[notekey];
    storeData(notekey, note);

    $($(this).offsetParent()).offsetParent().append("<div class='transcluded-content'></div>");

    $($(this).offsetParent()).offsetParent().children(".transcluded-content").append("<div id=" + transkey + " class='transcludor-links'></div>");
    $($(this).offsetParent()).offsetParent().children(".transcluded-content").children("#" + transkey + ".transcludor-links").append($.templates.weaverLink.render(allnotes[transkey]));

    $($(this).offsetParent()).offsetParent().children("#transcludorSrcTool").remove();
    $($(this).offsetParent()).offsetParent().children(".transcludor-content").remove();

    $("#" + notekey + ".note-dom").find("#transView").css('visibility', 'visible');
    $("#" + notekey + ".note-dom").find("#transAdd").css('visibility', 'hidden');
    $("#" + notekey + ".note-dom").find("#transRem").css('visibility', 'visible');
}

// Remove Transclusion
function removeTrans(event) {
    event.stopImmediatePropagation();
    var transkey = $($(this).parent()).siblings().children(".transcludor-links").attr("id");
    var notekey = $($(this).offsetParent()).offsetParent().attr("id");

    delete allnotes[notekey].transclusion;
    var note = allnotes[notekey];
    storeData(notekey, note);

    $($(this).parent()).siblings(".transcluded-content").remove();

    $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").remove();

    if ($("#" + notekey + ".note-dom").find("#transView").hasClass("active")) {
        $("#" + notekey + ".note-dom").find("#transView").toggleClass("active");
    }

    $("#" + notekey + ".note-dom").find("#transView").css('visibility', 'hidden');
    $("#" + notekey + ".note-dom").find("#transAdd").css('visibility', 'visible');
    $("#" + notekey + ".note-dom").find("#transRem").css('visibility', 'hidden');
}

// Search Transclusion Search List
function tranSrcClrBtn(event) {
    event.stopImmediatePropagation();
    var transkey = $($(this).offsetParent()).offsetParent().attr("id");

    $.each($("#" + transkey + ".note-dom").find(".transcludor-links"), function (index, value) {
        $("#" + transkey + ".note-dom").find("#" + value.id + ".transcludor-links").show();
    });
    $(this).siblings("#transcludorSrcBar")[0].value = "";

    $("#" + transkey + ".note-dom").find("#transcludorSrcBar").focus();
}

// View Transclusion
function viewTrans(event) {
    event.stopImmediatePropagation();
    $(this).toggleClass("active");
    var notekey = $($(this).offsetParent()).offsetParent().attr("id");
    var transkey = $("#" + notekey + ".note-dom").find(".transcludor-links").attr("id");

    if ($(this).hasClass("active")) { //$("#" + transkey + ".transcludor-viewer").length === 0     
        loadTransclusion(notekey, transkey);
    } else {
        $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").remove();
    }

    $(document).on("click", "#hideTrnVr", hideTransView);
    $(document).on("click", "#refreshTrnVr", refreshTransView);
}

// Load Transclusion Viewer
function loadTransclusion(notekey, transkey) {
    $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").remove();
    $("." + notekey + ".el-highlight").prepend("<div class='transcludor-viewer'></div>");
    $("." + notekey + ".el-highlight").find(".transcludor-viewer").attr('id', transkey);

    var hdrBaseUrl = allnotes[transkey].urlProtocol + "//" + allnotes[transkey].urlHost;
    var hdrArgs = allnotes[transkey].urlPathname + allnotes[transkey].urlParameter;

    var data = {};

    data.baseurl = hdrBaseUrl;
    data.args = hdrArgs;
    data.anchor = allnotes[transkey].anchor;

    chrome.runtime.sendMessage({ // Send message to background.js
        type: "retrieveTrans",
        data: data
    });


    var XHrRes = "";
    var cnt = 0;

    chrome.runtime.onMessage.addListener(function (msg, sender) {
        if (msg.status === 1 && cnt === 0) {
            if (msg.text.length > 0) {
                XHrRes = msg.text;
                $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").append("<div id='trnVr-banner'>" + "<b>* Transclusion Source: </b><i>" + hdrBaseUrl + hdrArgs + "</i>" + "</div><div id='trnVr-toolbar'><div id='hideTrnVr' class='ww ww-eye-slash lbutton' title='Hide Transclusion'></div><div id='refreshTrnVr' class='ww ww-refresh lbutton' title='Refresh Transclusion'></div></div><div id='trnVr-content'>" + XHrRes + "</div>");
            } else {
                XHrRes = "Annotation orphaned!";
                $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").append("<div id='trnVr-banner'>" + "<b>* Transclusion Source: </b><i>" + hdrBaseUrl + hdrArgs + "</i>" + "</div><div id='trnVr-toolbar'><div id='hideTrnVr' class='ww ww-eye-slash lbutton' title='Hide Transclusion'></div><div id='refreshTrnVr' class='ww ww-refresh lbutton' title='Refresh Transclusion'></div></div><div id='trnVr-content' style='color: red !important;'>" + XHrRes + "</div>");
            }



            cnt++;
        }
        if (msg.status === 0 && cnt === 0) {
            XHrRes = "Could not connect to server! Please try again later.";

            $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").append("<div id='trnVr-banner'>" + "<b>* Transclusion Source: </b><i>" + hdrBaseUrl + hdrArgs + "</i>" + "</div><div id='trnVr-toolbar'><div id='hideTrnVr' class='ww ww-eye-slash lbutton' title='Hide Transclusion'></div><div id='refreshTrnVr' class='ww ww-refresh lbutton' title='Refresh Transclusion'></div></div><div id='trnVr-content' style='color: red !important;'>" + XHrRes + "</div>");

            cnt++;
        }
    });
}

// Hide Transcusion viewer
function hideTransView(event) {
    event.stopImmediatePropagation();
    var transkey = $($(this).parent()).parent().attr("id");
    var notekey = $($(document).find("#" + transkey + ".transcludor-links")).offsetParent().offsetParent().attr("id");

    $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").remove();
    $("#" + notekey + ".note-dom").find("#transView").toggleClass("active");
}

// Refresh Transcusion viewer
function refreshTransView(event) {
    event.stopImmediatePropagation();
    var transkey = $($(this).parent()).parent().attr("id");
    var notekey = $($(document).find("#" + transkey + ".transcludor-links")).offsetParent().offsetParent().attr("id");

    loadTransclusion(notekey, transkey);
}

// Deleter function
function deleter(event) {
    event.stopImmediatePropagation();
    var notekey = $($(this).offsetParent()).offsetParent().attr("id");

    var elem = $("." + notekey + ".el-highlight")[0];
    var anncnt = 0;
    delete allnotes[notekey];
    delete aNotesonpage[notekey];
    removeData(notekey);

    elem.classList.forEach(function (dat, indx) {
        if (elem.classList[indx].substring(0, 3) === "ww-") {
            anncnt++;
        }
    });

    if (anncnt === 1) {
        $("." + notekey + ".el-highlight").removeClass("el-highlight").removeClass(notekey);
    } else {
        $("." + notekey + ".el-highlight").removeClass(notekey);
    }

    $("#" + notekey + ".note-dom").remove();

    /*var options = {};
    options.separateWordSearch = false;
    options.diacritics = false;
    options.debug = false;
    $("#" + notekey + ".note-dom").unmark(options);*/

    calcAnnCntOnPg();
}

// Eraser function
function eraser(event) {
    event.stopImmediatePropagation();
    var notekey = $($(this).offsetParent()).offsetParent().attr("id");
    var note = allnotes[notekey];
    var commentkey = $(this).parent().attr("id");

    delete allnotes[notekey].oldnotes[commentkey];
    $.when(delete note.oldnotes[commentkey]).then(storeData(notekey, note));

    if (Object.keys(allnotes[notekey].oldnotes).length === 0) {
        $($(this).parent()).parent().css("display", "none");
    }
    $($(this).parent()).remove();
}

// Render and store new comment
function newComment(event) {
    event.stopImmediatePropagation();
    if (event.keyCode === 13) {
        // event.stopImmediatePropagation();

        var notekey = $($(this).parent()).parent().attr("id");
        var note = allnotes[notekey];
        var ts = moment().format();

        allnotes[notekey].oldnotes[ts] = $(this).val();
        $.when(note.oldnotes[ts] = $(this).val()).then(storeData(notekey, note));

        var $commentDOM = $("<div id='" + ts + "' class='nhtext'>" + note.oldnotes[ts] + "<br><i style='font-size: 8px;'>" + moment(ts).format('lll') + "</i>" + "<b id='eraser' class='ww ww-times' aria-hidden='true' title='Delete Comment'></b> </div>");
        $(this).prev(".weaver-old-comments").css("display", "inline-block").append($commentDOM);
        $(this).val(null);
    }
}

// Linkup function
function linkUp(event) {
    event.stopImmediatePropagation();
    var tempkey = $(this).offsetParent().offsetParent().offsetParent().attr("id");
    var tempnote = allnotes[tempkey];
    var templink = $(this).offsetParent().attr("id");
    if ($(this).hasClass("ww-link")) {
        $.when(tempnote.links.push(templink)).then(storeData(tempkey, tempnote));
    } else {
        var j = tempnote.links.indexOf(templink);
        $.when(tempnote.links.splice(j, 1)).then(storeData(tempkey, tempnote));
    }
    $(this).toggleClass('ww-link ww-chain-broken');
    if ($(this).hasClass('ww-link')) {
        $(this).attr('title', 'Add Link');
    } else {
        $(this).attr('title', 'Remove Link');
    }
}


// New note functions/////////////////////////////////////////////////////////////////////////////
// Create new note
function createNewNote() {
    var note = {};
    var tempUrl = window.document.location.href.toString();
    note.urlProtocol = window.document.location.protocol.toString();
    note.urlHost = window.document.location.host.toString();
    note.urlPathname = window.document.location.pathname.toString();
    note.urlParameter = (tempUrl.substring(note.urlProtocol.length + 2 + note.urlHost.length + note.urlPathname.length)).toString();
    note.selectedtext = wselectedtext;
    note.addedon = moment().format('LLL');
    note.anchor = [];
    note.oldnotes = {};
    note.links = [];
    note.description = {};
    return note;
}

// Generate note key
function genNoteKey() {
    var notekey = (function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return function () {
            return 'ww-' + Date.now() + '-' + s4() + s4();
        };
    })();
    return notekey();
}

// Generate anchor
function elemJSON(node, wselectedanchor) {
    var nodeDataArray = [];

    var a = 0;
    var d = 0; // Variable for depth
    var i = -1;

    toJSON(node, wselectedanchor, d);

    function toJSON(node, wselectedanchor, d, iframeNodes) {

        if (node.nodeName !== "HEAD" && node.nodeName !== "SCRIPT" && node.nodeName !== "NOSCRIPT" && node.nodeType !== 8 && node.nodeType !== 10) {
            i++;
            nodeDataArray[i] = {
                nodeName: node.nodeName
            };

            var tempUrl = nodeDataArray[i].urlProtocol + "//" + nodeDataArray[i].urlHost + nodeDataArray[i].urlPathname + nodeDataArray[i].urlParameter;

            if (nodeDataArray[i].nodeName === "HTML") {
                tempUrl = node.baseURI;
            }

            if (node.id) {
                nodeDataArray[i].id = node.id;
            }

            try {
                if (node.classList.length > 0) {
                    var idx = 0;
                    nodeDataArray[i].classList = [];
                    node.classList.forEach(function (dat, indx) {
                        if (node.classList[indx] !== "el-highlight" && node.classList[indx].substring(0, 3) !== "ww-") {
                            nodeDataArray[i].classList[idx] = node.classList[indx];
                            idx++;
                        }
                    });
                }
            } catch (err) {}

            try {
                if (Object.keys(node.dataset).length !== 0) {
                    nodeDataArray[i].dataset = JSON.stringify(node.dataset);
                }
            } catch (err) {}

            nodeDataArray[i].nodeDepth = d;

            if (node.nodeValue) {
                nodeDataArray[i].nodeValue = node.nodeValue;

                if (wselectedanchor.oneNode && node.nodeValue === wselectedanchor.startNode) {
                    nodeDataArray[i].annotated = true;
                    nodeDataArray[i].startOffset = wselectedanchor.startOffset;
                    nodeDataArray[i].endOffset = wselectedanchor.endOffset; //wselectedanchor.endNode.length
                } else {
                    if (a === 1) {
                        nodeDataArray[i].annotated = true;
                        nodeDataArray[i].startOffset = 0;
                        nodeDataArray[i].endOffset = 0;
                    }

                    if (node.nodeValue === wselectedanchor.startNode) {
                        a = 1;
                        nodeDataArray[i].annotated = true;
                        nodeDataArray[i].startOffset = wselectedanchor.startOffset;
                        nodeDataArray[i].endOffset = 0;
                    }

                    if (node.nodeValue === wselectedanchor.endNode) {
                        nodeDataArray[i].annotated = true;
                        nodeDataArray[i].startOffset = 0;
                        nodeDataArray[i].endOffset = wselectedanchor.endNode.length - wselectedanchor.endOffset;
                        a = 0;
                    }
                }
            }
            if (node.alt) {
                nodeDataArray[i].alt = node.alt;
            }
            if (node.src) {
                nodeDataArray[i].src = node.src;
            }
            if (node.href) {
                nodeDataArray[i].href = node.href;
            }

            iframeNodes = (node.contentWindow || node.contentDocument);
            var childNodes = node.childNodes;
            if (iframeNodes) {
                try {
                    childNodes = iframeNodes.document.childNodes;
                } catch (e) {
                    console.log(e);
                }

            }

            if (childNodes.length > 0) {
                d++;
                var length = childNodes.length;
                for (var j = 0; j < length; j++) {
                    toJSON(childNodes[j], wselectedanchor, d, iframeNodes);
                }
            }
        }
    }

    return nodeDataArray;
}


// Stograge Functions/////////////////////////////////////////////////////////////////////////////
// Store Data
function storeData(key, jsonData, callback) {
    var storeObj = {};
    storeObj[key] = jsonData;

    if (callback && typeof callback === "function") {
        chrome.storage.local.set(storeObj, callback);
    } else {
        chrome.storage.local.set(storeObj, function () {});
    }
}

// Get Data
function getData(key, callback) {
    if (!callback || typeof callback !== "function")
        console.error("Please provide callback before calling getData method.");
    else
        chrome.storage.local.get(key, callback);
}

// Remove Data
function removeData(key) {
    chrome.storage.local.remove(key);
}
//////////////////////////////////////////////////////////////////////////////////////////////////
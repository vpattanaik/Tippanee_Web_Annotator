// Declare local variables
var userName = null;
var grpLst = [];
var tempAuthState = false;
var allnotes = {};
var aNotesonpage = {};
var oNotesonpage = {};
var duppANOP = {};
var wselectedanchor = {};
var wselectedtext;
var wselectedelement;

// Stop HREFs from re-directing on note-dom click events
$("a").on("click", function (e) {
    if ($(".note-dom").find(e.target).length !== 0 || $("#wtarget").hasClass("wlight")) {
        e.preventDefault();
    }
});

// Listener function will be called when a tab is updated
chrome.runtime.onMessage.addListener(function (message, sender) {
    switch (message.type) {
        case "clear-tipp":
            // Request to clear Tippanee
            $("body").children("#weaver-bubble").remove(); // Remove Tippanee bubble
            $("body").children("#weaver-dash").remove(); // Remove Tippanee dash
            // Remove highlighted annotations
            Object.keys(aNotesonpage).forEach(function (key) {
                $("." + key + ".el-highlight").removeClass("el-highlight").removeClass(key);
            });
            aNotesonpage = {};
            oNotesonpage = {};
            duppANOP = {};
            //console.log("clear-tipp Complete");
            break;

        case "render-tipp":
            // Request to render Tippanee
            userName = message.usr;
            //console.log("User:", userName);
            renderTippFunc();
            break;

        case "update-tipp":
            // Remove highlighted annotations
            Object.keys(aNotesonpage).forEach(function (key) {
                $("." + key + ".el-highlight").removeClass("el-highlight").removeClass(key);
            });
            aNotesonpage = {};
            oNotesonpage = {};
            duppANOP = {};
            $('.transcludor-viewer').remove();
            renderOldNotes();
            //console.log("update-tipp Complete");
            break;

        case "tab-actvtd":
            // Called when a tab is activated
            calcAnnCntOnPg();
            //console.log("tab Activated");
            break;

        case "auth-screen-alert":
            var err = message.alertErr;
            switch (err) {
                case "auth/wrong-password":
                case "auth/email-already-in-use":
                    $("#wrngPsw").fadeToggle("fast");
                    setTimeout(function () {
                        $("#wrngPsw").fadeToggle("fast");
                    }, 2000);
                    document.getElementById('inputPassword').value = "";
                    document.getElementById('inputPassword').focus();
                    break;
                case "auth/user-not-found":
                    $("#unkwnEmPs").fadeToggle("fast");
                    setTimeout(function () {
                        $("#unkwnEmPs").fadeToggle("fast");
                    }, 2000);
                    document.getElementById('btnSignUp').focus();
                    break;
                default:
                    //do nothing
            }
            break;

        case "user-in":
            var user = message.user;
            var mode = message.mode;
            if (user) {
                userName = user;
                if ($("#wlogin").hasClass("wdark")) {
                    $("#wlogin").toggleClass('wlight wdark');
                }
                var str = "Logged in as " + userName;
                $("#wlogin").attr("title", str);
                var logAlert;
                switch (mode) {
                    case "btnLogIn":
                        $("#myloginpage").empty();
                        logAlert = "<div id='elem-signin' class='ww-form-signin'><div class='ww-form-header'>Logged in as " + userName + "</div></div>";
                        $("#myloginpage").append(logAlert);
                        setTimeout(function () {
                            $("#woverlay-close").trigger("click");
                        }, 2000);
                        getServerAnno(function () { /*do nothing*/ });
                        break;
                    case "btnSignUp":
                        $("#myloginpage").empty();
                        logAlert = "<div id='elem-signin' class='ww-form-signin'><div class='ww-form-header'>Signed up as " + userName + "</div></div>";
                        $("#myloginpage").append(logAlert);
                        setTimeout(function () {
                            $("#woverlay-close").trigger("click");
                        }, 2000);
                        getServerAnno(function () { /*do nothing*/ });
                        break;
                    default:
                        //do nothing
                }
            }
            break;

        case "user-not-in":
            $("#lgOtCmplt").fadeToggle("fast");
            setTimeout(function () {
                $("#lgOtCmplt").fadeToggle("fast");
            }, 2000);
            document.getElementById('elem-signin').style.display = "block";
            document.getElementById('inputEmail').value = "";
            document.getElementById('inputPassword').value = "";
            document.getElementById('inputEmail').focus();
            break;

        case "set-server-anno":
            allnotes = message.data;
            grpLst = message.grp;
            renderOldNotes();
            break;

        case "set-local-anno":
            allnotes = {};
            getLocalAnno(null, function (items) {
                for (var key in items) {
                    if (key.substring(0, 3) === "ww-") {
                        allnotes[key] = items[key];
                    }
                }
                renderOldNotes();
            });
            break;

        default:
            //console.log("Unrecognized message type: " + message.type);
            break;
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

// Render the TippDOM elements
function renderTippFunc() {
    if (userName === null) {
        // Fetch data from storage and save into local variable 'allnotes'
        getLocalAnno(null, function (items) {
            for (var key in items) {
                if (key.substring(0, 3) === "ww-") {
                    allnotes[key] = items[key];
                }
            }
            //console.log("Getting annotation data from local");
            console.log("Available Notes:" + Object.keys(allnotes).length);//////////////////////////////////////////////////////////////
            // Adds Tippanee bubble into webpage DOM 'THEN'
            // Adds Tippanee dash into webpage DOM
            addTippDoms();
            //console.log("render-tipp Complete");
        });
    } else {
        getServerAnno(function () {
            //console.log("Getting annotation data from server");
            //console.log("Available Notes:" + Object.keys(allnotes).length);
            // Adds Tippanee bubble into webpage DOM 'THEN'
            // Adds Tippanee dash into webpage DOM
            addTippDoms();
            //console.log("render-tipp Complete");
        });
    }
}

// Get annotation data (from local or server)
function addTippDoms() {
    addBubble(function () {
        renderDash(function () {
            if (userName) {
                if ($("#wlogin").hasClass("wdark")) {
                    $("#wlogin").toggleClass('wlight wdark');
                }
                var str = "Logged in as " + userName;
                $("#wlogin").attr("title", str);
            } else {
                if ($("#wlogin").hasClass("wlight")) {
                    $("#wlogin").toggleClass('wlight wdark');
                }
                $("#wlogin").attr("title", "Log in / Sign up");
            }
        });
    });
}

// Bubble Functions///////////////////////////////////////////////////////////////////////////////
// Add bubble to website DOM
function addBubble(callback) {
    $("body").children("#weaver-bubble").remove(); // Remove Tippanee bubble

    // Add bubble to the top of the page.
    var $bubbleDOM = $("<div id='weaver-bubble'><div id='weaver32' title='Add to Tippanee'></div></div>");
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
            //console.log(err);
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
            try {
                wselectedanchor.endOffset = wselection.anchorNode.nodeValue.length - wselection.anchorOffset;
            } catch (e) {}
        } else {
            try {
                wselectedanchor.endOffset = wselection.focusNode.nodeValue.length - wselection.focusOffset;
            } catch (e) {}
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
function renderDash(callback) {
    $("body").children("#weaver-dash").remove(); // Remove Tippanee dash
    $("body").append($.templates.dashDOM.render());

    // Event button for arrow button on dashboard
    $("#warrow").on("click", function () {
        $("#warrow").toggleClass('ww-angle-right ww-angle-left');
        $("#weaver-dash").toggleClass('weaver-dash-max weaver-dash-min');
        //$("#weaver-toolbar").toggle();
    });

    // Event button for login on dashboard
    $("#wlogin").on("click", function () {
        renderLoginPage();
        //$("#wlogin").toggleClass('wlight wdark');
    });

    // Event button for web of data on dashboard
    $("#wweboanch").on("click", function () {
        $("#wweboanch").toggleClass('wlight wdark');
        renderWeboanch();
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
        //var t0 = performance.now();
        //var t1 = performance.now();
        //console.log("All anchors reattached in " + (t1 - t0) + " milliseconds.");

        if (userName !== null) {
            getServerAnno(renderOldNotes);
        } else {
            renderOldNotes();
        }


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

    callback();
}

// Renders Old Notes
function renderOldNotes() {
    //console.log("renderOldNotes Start!");
    $("#wanchs.wtabcontents").empty();
    Object.keys(aNotesonpage).forEach(function (key) {
        $("." + key + ".el-highlight").removeClass("el-highlight").removeClass(key);
    });
    aNotesonpage = {}; // Remove all saved 'annotated notes on page'
    oNotesonpage = {}; // Remove all saved 'orphaned notes on page'
    duppANOP = {};

    for (var key in allnotes) {
        var tempUrl = allnotes[key].urlProtocol + "//" + allnotes[key].urlHost + allnotes[key].urlPathname + allnotes[key].urlParameter; //URL of Notes
        if (tempUrl === window.location.href) { //Check if Note URLs are same as current DOM

            //var ti0 = performance.now();
            //console.log(allnotes[key]);

            var annReatchStat = false; // Status if annotation is attched or not

            var anr = allnotes[key].anchor; //Notes previously saved on URL
            var selTxt = allnotes[key].selectedtext;

            var anrlen = anr.length; //Number of notes saved on URL
            var anrTn = 0; // Textual nodes in anchor
            anr.forEach(function (dat, indx) {
                if (anr[indx].nodeName == "#text") {
                    anrTn++;
                } // Counting textual nodes
            });
            var anrNTn = anrlen - anrTn; // Non-Textual nodes in anchor

            var wpg = []; //Array to save DOM nodes
            var lim; //Number of DOM nodes

            var mat = []; // Stores matches
            var mis = []; // Stores mismatches
            var matWt = 0.75; // Bias for matches
            var misWt = 0.25; // Bias for mismatches
            var ntnWt = Math.round((anrlen / (anrNTn + 3 * anrTn)) * 1e2) / 1e2; // Bias for non-text nodes (for 0.25)
            var tnWt = Math.round((3 * anrlen / (anrNTn + 3 * anrTn)) * 1e2) / 1e2; // Bias for text nodes (for 0.75)

            /*console.log('anrlen: ' + anrlen);
            console.log('anrNTn: ' + anrNTn);
            console.log('anrTn: ' + anrTn);
            console.log('ntnWt: ' + ntnWt);
            console.log('tnWt: ' + tnWt);*/

            var matThres = 0.5; // Threshold for deciding if annotation should be attached or orphaned

            var wpgIdx; // Index of 'wpg' elements
            var tempAnr; // tempAnr saves instance on Anchor node

            wpg = $(anr[0].nodeName + ":contains('" + selTxt + "')"); // Find all nodes that contain selected string

            var arrMAXmat = []; // Aggregated matches
            var idxMAXmat; // Index of element with maximum aggregated matches 

            startMatching();

            var strvarKey = "EvaluationData--" + key.toString();
            var strvarData = {};

            if (mat[wpgIdx] !== anrlen || mis[wpgIdx] !== 0) {

                genstrSimIdx('typStr');

                if (mat[idxMAXmat] / anr.length >= matThres) {
                    annReatchStat = true;
                } else {

                    wpg = [];

                    if (anr[0].id) {
                        wpg = document.getElementById(anr[0].id);
                    } //Check Anchor--DOM node's ID
                    else if (anr[0].className) {
                        wpg = document.getElementsByClassName(anr[0].className);
                    } //Check Anchor--DOM node's className
                    else if (anr[0].nodeName) {
                        wpg = document.getElementsByTagName(anr[0].nodeName);
                    } //Check Anchor--DOM node's nodeName

                    startMatching();

                    genstrSimIdx('typTre');

                    if (mat[idxMAXmat] / anr.length >= matThres) {
                        annReatchStat = true;
                    } else {
                        annReatchStat = false;
                    }
                }

            } else {
                annReatchStat = true;
                genstrSimIdx('typStr');
            }

            setLocalAnno(strvarKey, strvarData);

            var note = allnotes[key];
            var notekey = key;
            var $noteDOM, arr, $commentDOM;

            if (annReatchStat === true) {
                printAncAnno();
            } else {
                printOrpAnno();
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

            // Generate matches & mismatches
            function startMatching() {
                if (wpg.length === 0) {
                    // do nothing
                } else if (!wpg.length) { //Coverts single DOM node to array
                    wpg = new Array(wpg);
                }

                lim = wpg.length;

                // Start with empty matches & mismatches
                mat = [];
                mis = [];


                for (wpgIdx = 0; wpgIdx < lim; wpgIdx++) {
                    tempAnr = JSON.parse(JSON.stringify(anr)); //tempAnr saves instance on Anchor node

                    // Initialize zero 'matches' & 'mismatches'
                    mat.push(0);
                    mis.push(0);

                    jsonCompare(wpg[wpgIdx]);

                    if (Math.round(mat[wpgIdx] * 1e2) / 1e2 === anrlen && Math.round(mis[wpgIdx] * 1e2) / 1e2 === 0) { //Check if DOM node & Anchor node are exactly same
                        break;
                    }
                }
            }

            // Generate & store similarity index
            function genstrSimIdx(mtchtyp) {
                arrMAXmat = [];
                mat.forEach(function (dat, indx) {
                    arrMAXmat.push(matWt * mat[indx] - misWt * mis[indx]); // Calculating aggregated matches // Math.round((matWt * mat[indx] - misWt * mis[indx]) * 1e2) / 1e2
                });

                idxMAXmat = arrMAXmat.indexOf(Math.max.apply(Math, arrMAXmat)); // Find maximum aggregated matches

                switch (mtchtyp) {
                    case 'typStr':
                        strvarData.strMat = mat;
                        strvarData.strMis = mis;
                        strvarData.strIdxMAXmat = idxMAXmat;
                        strvarData.strSimIdx = mat[idxMAXmat] / anr.length;
                        break;

                    case 'typTre':
                        strvarData.treMat = mat;
                        strvarData.treMis = mis;
                        strvarData.treIdxMAXmat = idxMAXmat;
                        strvarData.treSimIdx = mat[idxMAXmat] / anr.length;
                        break;

                    default:
                        // do nothing
                        break;
                }
            }

            // Print anchored annotation
            function printAncAnno() {
                var elem = wpg[idxMAXmat];

                aNotesonpage[notekey] = elem;

                $noteDOM = $("<div id='" + notekey + "' class='note-dom'></div></div>");
                $("#wanchs").prepend($noteDOM);
                $("#" + notekey + ".note-dom").append($.templates.weaverNote.render(note));

                $("#" + notekey + ".note-dom").children(".weaver-container").append("<div id='sim-index' class='weaver-header' style='text-align: left !important;'>Similarity Index: " + (Math.round((mat[idxMAXmat] / anr.length) * 1e2) / 1e2).toFixed(2) + "</div>");

                arr = $.map(note.oldnotes, function (value, key) {
                    return [
                        [key, value]
                    ];
                });

                for (var wpgIdx = 0; wpgIdx < arr.length; wpgIdx++) {
                    if (arr[wpgIdx][1].addedby === userName || userName === null) {
                        $commentDOM = $("<div id='" + arr[wpgIdx][0] + "' class='nhtext'>" + arr[wpgIdx][1].note + "<br><br><i style='font-size: 8px;'>" + moment(arr[wpgIdx][0]).format('lll') + "</i>" + "<b id='eraser' class='ww ww-times' aria-hidden='true' title='Delete Comment'></b> </div>");
                    } else {
                        $commentDOM = $("<div id='" + arr[wpgIdx][0] + "' class='nhtext'><b>" + arr[wpgIdx][1].addedby + "</b><br><br>&nbsp;&nbsp;" + arr[wpgIdx][1].note + "<br><br><i style='font-size: 8px;'>" + moment(arr[wpgIdx][0]).format('lll') + "</i>" + "</div>");
                    }
                    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-old-comments").css("display", "inline-block").append($commentDOM);
                }

                if (Math.round((mat[idxMAXmat] / anr.length) * 1e2) / 1e2 === 1) {
                    duppANOP[notekey] = true;
                } else {
                    duppANOP[notekey] = false;
                }

                if (userName !== null) {
                    var wcPrnt = $("#" + notekey + ".note-dom").children(".weaver-container");
                    var ddChld = document.createElement('div');
                    ddChld.id = "share-dd";
                    ddChld.classList.add("weaver-dd-options");
                    var inrHtml = "";
                    inrHtml = inrHtml.concat("<select id='share-dd-select'><option value='Private'>Private</option>");
                    grpLst.forEach(function (val) {
                        inrHtml = inrHtml.concat("<option value='", val, "'>", val, "</option>");
                    });
                    inrHtml = inrHtml.concat("</select>");
                    ddChld.innerHTML = inrHtml;
                    wcPrnt.append(ddChld);

                    var slWt = allnotes[notekey].sharedwith;
                    var stWtStr = "#share-dd-select option[value='" + slWt + "']";
                    $("#" + notekey + ".note-dom").children(".weaver-container").find(stWtStr).attr('selected', 'selected');

                    if (allnotes[notekey].owner !== userName) {
                        $("#" + notekey + ".note-dom").children(".weaver-container").find("#share-dd-select").attr('disabled', true);
                        $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-options").children("#deleter").css('visibility', 'hidden');
                    }
                }



                $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-anno").css("cursor", "pointer");

                // Click event
                $(document).on("click", ".weaver-anno", glower);
                // Click event for transcludor
                $(document).on("click", "#transcludor", transcludor);
                // Change event for dropdown
                $(document).on("change", "#share-dd-select", changeAnnoGrp);
            }

            // Print orphaned annotation
            function printOrpAnno() {
                oNotesonpage[notekey] = null;

                $noteDOM = $("<div id='" + notekey + "' class='note-dom'></div></div>");
                $("#wanchs").append($noteDOM);
                $("#" + notekey + ".note-dom").append($.templates["o-weaverNote"].render(note));

                $("#" + notekey + ".note-dom").children(".weaver-container").append("<div id='sim-index' class='weaver-header' style='text-align: left !important;'>Orphan!</div>");

                arr = $.map(note.oldnotes, function (value, key) {
                    return [
                        [key, value]
                    ];
                });

                for (var wpgIdx = 0; wpgIdx < arr.length; wpgIdx++) {
                    if (arr[wpgIdx][1].addedby === userName || userName === null) {
                        $commentDOM = $("<div id='" + arr[wpgIdx][0] + "' class='nhtext'>" + arr[wpgIdx][1].note + "<br><br><i style='font-size: 8px;'>" + moment(arr[wpgIdx][0]).format('lll') + "</i>" + "<b id='eraser' class='ww ww-times' aria-hidden='true' title='Delete Comment'></b> </div>");
                    } else {
                        $commentDOM = $("<div id='" + arr[wpgIdx][0] + "' class='nhtext'><b>" + arr[wpgIdx][1].addedby + "</b><br><br>&nbsp;&nbsp;" + arr[wpgIdx][1].note + "<br><br><i style='font-size: 8px;'>" + moment(arr[wpgIdx][0]).format('lll') + "</i>" + "</div>");
                    }
                    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-old-comments").css("display", "inline-block").append($commentDOM);
                }

                if (userName !== null) {
                    var wcPrnt = $("#" + notekey + ".note-dom").children(".weaver-container");
                    var ddChld = document.createElement('div');
                    ddChld.id = "share-dd";
                    ddChld.classList.add("weaver-dd-options");
                    var inrHtml = "";
                    inrHtml = inrHtml.concat("<select id='share-dd-select'><option value='Private'>Private</option>");
                    grpLst.forEach(function (val) {
                        inrHtml = inrHtml.concat("<option value='", val, "'>", val, "</option>");
                    });
                    inrHtml = inrHtml.concat("</select>");
                    ddChld.innerHTML = inrHtml;
                    wcPrnt.append(ddChld);

                    var slWt = allnotes[notekey].sharedwith;
                    var stWtStr = "#share-dd-select option[value='" + slWt + "']";
                    $("#" + notekey + ".note-dom").children(".weaver-container").find(stWtStr).attr('selected', 'selected');

                    if (allnotes[notekey].owner !== userName) {
                        $("#" + notekey + ".note-dom").children(".weaver-container").find("#share-dd-select").attr('disabled', true);
                        $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-options").children("#deleter").css('visibility', 'hidden');
                    }
                }

                // Change event for dropdown
                $(document).on("change", "#share-dd-select", changeAnnoGrp);
            }

            // Compare Anchored Nodes to DOM Nodes
            function jsonCompare(node) {
                if (node.nodeName !== "HEAD" && node.nodeName !== "SCRIPT" && node.nodeName !== "NOSCRIPT" && node.nodeType !== 8 && node.nodeType !== 10) { //Ignore if node is 'HEAD, SCRIPT or other unusable types'
                    var j;
                    for (j = 0; j < tempAnr.length; j++) { //Repeat for all elements in Anchor node
                        var kvp = Object.keys(tempAnr[j]);

                        if (tempAnr[j].nodeName !== '#text' && node.nodeName !== '#text') { //Match 'non-text' elements
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

                                        tempAnr[j][kvp[k]].forEach(function (dat) {

                                            var fnd = tmpcl.find(function (val) {
                                                return val === dat;
                                            });

                                            if (fnd != null) {
                                                clcnt++;
                                            }

                                        });

                                        if (clcnt === tempAnr[j][kvp[k]].length) {
                                            fnd = fnd + 1 / (kvp.length - 1);
                                        }
                                    } else {
                                        if (node[kvp[k]] === tempAnr[j][kvp[k]]) {
                                            fnd = fnd + 1 / (kvp.length - 1);
                                        }
                                    }
                                }
                            }

                            if (fnd === 1) { //If all properties match///////////////////////////////////////////////////
                                mat[wpgIdx] = mat[wpgIdx] + Math.round((ntnWt * 1) * 1e2) / 1e2;
                                tempAnr.splice(j, 1); //Remove match element from Anchor node instance
                                break;
                            } else { //If some properties dont match
                                fnd = Math.round(fnd * 1e2) / 1e2; //Round value to second decimal place
                                mis[wpgIdx] = mis[wpgIdx] + Math.round((ntnWt * (1 - fnd)) * 1e2) / 1e2;
                            }
                        }

                        if (tempAnr[j].nodeName === '#text' && node.nodeName === '#text') { //Match 'text' elements
                            var fuzsim;
                            if (tempAnr[j].nodeValue === node.nodeValue) { //If all contents match///////////////////////////////////////////////////
                                mat[wpgIdx] = mat[wpgIdx] + Math.round((tnWt * 1) * 1e2) / 1e2;
                                tempAnr.splice(j, 1); //Remove match content from Anchor node instance
                                break;
                            } else { //If some contents dont match
                                try {
                                    var fuzcon = FuzzySet([tempAnr[j].nodeValue], useLevenshtein = true); //FUZZY TEXT MATCHING
                                    if (fuzcon.get(node.nodeValue)) {
                                        fuzsim = Math.round((fuzcon.get(node.nodeValue)[0][0]) * 1e2) / 1e2; //Round value to second decimal place 
                                    } else {
                                        fuzsim = 0;
                                    }

                                    if (fuzsim >= 0.5) { //If more than 50% contents match///////////////////////////////////////////////////
                                        mat[wpgIdx] = mat[wpgIdx] + Math.round((tnWt * fuzsim) * 1e2) / 1e2;
                                        tempAnr.splice(j, 1); //Remove match content from Anchor node instance
                                        break;
                                    } else { //If less than 50% contents match
                                        mis[wpgIdx] = mis[wpgIdx] + Math.round((tnWt * (1 - fuzsim)) * 1e2) / 1e2;
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
                            //console.log(e);
                        }
                    }
                    if (childNodes) {
                        try {
                            var length = childNodes.length;
                            for (j = 0; j < length; j++) {
                                jsonCompare(childNodes[j]);
                            }
                        } catch (e) {
                            //console.log(e);
                        }
                    }
                }
            }
            //var ti1 = performance.now();
            //console.log("Anchor reattached in " + (ti1 - ti0) + " milliseconds.");
        }
    }

    Object.keys(aNotesonpage).forEach(function (key) {
        highlightAnchor(aNotesonpage[key], key);
    });

    //$.holdReady( true );
    //console.log("renderOldNotes Complete!");

    calcAnnCntOnPg();
    //console.log(Object.keys(allnotes));
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

        if (allnotes[notekey].oldnotes) {
            Object.keys(allnotes[notekey].oldnotes).forEach(
                function (key) {
                    var k = key;
                    var v = allnotes[notekey].oldnotes[k];
                    var $browserComment;
                    if (userName !== null) {
                        $browserComment = $("<div id='" + k + "' class='nhtext'><i>" + v.addedby + "</i><br><br>&nbsp;&nbsp;" + v.note + "<br><br><i style='font-size: 8px;'>" + moment(k).format('lll') + "</i>" + "</div>");
                    } else {
                        $browserComment = $("<div id='" + k + "' class='nhtext'>" + v.note + "<br><br><i style='font-size: 8px;'>" + moment(k).format('lll') + "</i>" + "</div>");
                    }

                    $("#" + notekey + ".browser-container").children(".browser-old-comments").append($browserComment);
                });
        }
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
                        wendOffset = wendNode.childNodes.length;
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
function renderWeboanch() {
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
            var tempUrl = allnotes[nodeElem].urlProtocol + "//" + allnotes[nodeElem].urlHost + allnotes[nodeElem].urlPathname + allnotes[nodeElem].urlParameter;
            var edgeArr;
            if (allnotes[nodeElem].links) {
                edgeArr = allnotes[nodeElem].links;
            } else {
                edgeArr = [];
            }

            var webodNodeElement = {};
            webodNodeElement.id = nodeArr.indexOf(nodeElem);

            //console.log(webodNodeElement.id);
            webodNodeUrl.push(tempUrl);

            try {
                webodNodeElement.value = Object.keys(allnotes[nodeElem].oldnotes).length;
            } catch (e) {
                webodNodeElement.value = 0;
            }

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

    $("body").append("<div id='weaver-overlay' class='woverlay-hide'><div class='woverlay-content'><div id='woverlay-toolbar'><div id='woverlay-close' class='ww ww-times' title='Close'></div></div><div id='mywebofanch'></div></div></div>");
    var container = document.getElementById('mywebofanch');
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
        physics: {
            enabled: true,
            forceAtlas2Based: {
                gravitationalConstant: -15,
                centralGravity: 0.01,
                springConstant: 0.08,
                springLength: 50,
                damping: 0.4,
                avoidOverlap: 0
            },
            maxVelocity: 50,
            minVelocity: 0.1,
            solver: 'forceAtlas2Based',
            stabilization: {
                enabled: true,
                iterations: 1000,
                updateInterval: 100,
                onlyDynamicEdges: false,
                fit: true
            },
            timestep: 0.5,
            adaptiveTimestep: true
        }
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
        $("#wweboanch").toggleClass('wlight wdark');
        $("body").children("#weaver-overlay").remove();
    });

    if ($("#weaverSrcBar").css("visibility") === 'visible') {
        $("#wsearch").trigger("click");
    }
}

// Renders Login Tab
function renderLoginPage() {
    $("body").children("#weaver-overlay").remove();

    $("body").append("<div id='weaver-overlay' class='woverlay-hide'><div class='woverlay-content'><div id='woverlay-toolbar'><div id='woverlay-close' class='ww ww-times' title='Close'></div></div><div id='myloginpage'></div></div></div>");

    var logInDivs = "<div id='elem-signin' class='ww-form-signin'><div class='ww-form-header'>Log in / Sign up</div><input type='email' id='inputEmail' class='ww-form-control' placeholder='Email address'> <input type='password' id='inputPassword' class='ww-form-control' placeholder='Password'><div id='lgsuMsgs'><div id='wrngPsw' class='ww-alert ww-alert-danger ww-tipLblHide' role='alert'><strong>Wrong password!</strong><br>Try again.</div><div id='invldEm' class='ww-alert ww-alert-danger ww-tipLblHide' role='alert'><strong>Invalid email!</strong><br>Try again.</div><div id='invldPsLen' class='ww-alert ww-alert-danger ww-tipLblHide' role='alert'>Please choose a password of minimum <strong>8 digit</strong>.</div><div id='unkwnEmPs' class='ww-alert ww-alert-danger ww-tipLblHide' role='alert'><strong>Couldn't find your Tippanee Account.</strong> Sign up to continue.</div></div><button class='ww-tipBtn ww-tipBtn-lg ww-tipBtn-primary ww-tipBtn-block' id='btnLogIn' title='Log In'>Log In</button> <button class='ww-tipBtn ww-tipBtn-lg ww-tipBtn-secondary ww-tipBtn-block' id='btnSignUp' title='Sign Up'>Sign Up</button></div>";

    var logOutDivs = "<div id='elem-signin' class='ww-form-signin'><div class='ww-form-header'>Logged in as " + userName + "</div><button class='ww-tipBtn ww-tipBtn-lg ww-tipBtn-secondary ww-tipBtn-block' id='btnRdrWeb' title='Goto Tippanee dashboard on the web'>Goto Tippanee</button><button class='ww-tipBtn ww-tipBtn-lg ww-tipBtn-danger ww-tipBtn-block' id='btnLogOut' title='Log Out'>Log Out</button></div>";

    $('#weaver-overlay').toggleClass('woverlay-show woverlay-hide');

    if (userName) {
        $("#myloginpage").append(logOutDivs);
        logoutAssist();
    } else {
        $("#myloginpage").append(logInDivs);
        loginAssist();
    }

    $("#woverlay-close").on("click", function () {
        $("body").children("#weaver-overlay").remove();
    });

    if ($("#weaverSrcBar").css("visibility") === 'visible') {
        $("#wsearch").trigger("click");
    }
}

// Function for logout
function logoutAssist() {
    $("#btnRdrWeb").on("click", function () {
        window.open('https://tippaneemessagingserver.firebaseapp.com/');
    });
    // Add log out event
    $("#btnLogOut").on("click", function () {
        var lgData = {};
        userName = null;
        $("body").children("#weaver-overlay").remove();
        $("#wlogin").toggleClass('wlight wdark');
        $("#wlogin").attr("title", "Log in / Sign up");

        lgData.md = "btnLogOut";
        chrome.runtime.sendMessage({ // Send message to background.js
            type: "checkUserLogin",
            data: lgData
        });
    });
}

// Function for login
function loginAssist() {
    //Getting elements
    var inputEmail = document.getElementById('inputEmail');
    var inputPassword = document.getElementById('inputPassword');
    var mode;

    inputEmail.focus();

    // Login - Signup function
    function funcLgnSgu(mode) {
        var email = inputEmail.value;
        var pass = inputPassword.value;
        var lgData = {};

        var valEm = validateEmail(email);
        var valPsLn = String(pass).length >= 8;

        if (valEm === true) { // For valid email
            if (valPsLn === true) { // For valid password length

                lgData.md = mode;
                lgData.el = email;
                lgData.pw = pass;

                chrome.runtime.sendMessage({ // Send message to background.js
                    type: "checkUserLogin",
                    data: lgData
                });

            } else { // For invalid password length
                inputPassword.focus();
                $("#invldPsLen").fadeToggle("fast");
                setTimeout(function () {
                    $("#invldPsLen").fadeToggle("fast");
                }, 2000);
            }
        } else { // For invalid email
            inputEmail.focus();
            $("#invldEm").fadeToggle("fast");
            setTimeout(function () {
                $("#invldEm").fadeToggle("fast");
            }, 2000);
        }
    }

    inputEmail.addEventListener('keydown', function (e) {
        if (!e) e = window.event;
        var keyCode = e.keyCode || e.which;
        if (keyCode == '13') {
            inputPassword.focus();
        }
    }, false);

    inputPassword.addEventListener('keydown', function (e) {
        if (!e) e = window.event;
        var keyCode = e.keyCode || e.which;
        if (keyCode == '13') {
            mode = "btnLogIn";
            funcLgnSgu(mode);
        }
    }, false);

    // Add login event
    $("#btnLogIn").on("click", function () {
        mode = "btnLogIn";
        funcLgnSgu(mode);
    });

    // Add signup event
    $("#btnSignUp").on("click", function () {
        mode = "btnSignUp";
        funcLgnSgu(mode);
    });

    // Validate email format
    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }
}

// Highlights Anchor
function highlightAnchor(helem, hnotekey) {
    var anr = allnotes[hnotekey].anchor;
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
    if (userName !== null) {
        setServerAnno(notekey, note, "Private");
        var wcPrnt = $("#" + notekey + ".note-dom").children(".weaver-container");
        var ddChld = document.createElement('div');
        ddChld.id = "share-dd";
        ddChld.classList.add("weaver-dd-options");
        var inrHtml = "";
        inrHtml = inrHtml.concat("<select id='share-dd-select'><option value='Private'>Private</option>");
        grpLst.forEach(function (val) {
            inrHtml = inrHtml.concat("<option value='", val, "'>", val, "</option>");
        });
        inrHtml = inrHtml.concat("</select>");
        ddChld.innerHTML = inrHtml;
        wcPrnt.append(ddChld);

        var slWt = allnotes[notekey].sharedwith;
        var stWtStr = "#share-dd-select option[value='" + slWt + "']";
        $("#" + notekey + ".note-dom").children(".weaver-container").find(stWtStr).attr('selected', 'selected');
    } else {
        setLocalAnno(notekey, note);
    }

    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-new-comments").focus();
    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-anno").css("cursor", "pointer");

    highlightAnchor(elem, notekey);
    aNotesonpage[notekey] = elem;
    duppANOP[notekey] = true;

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
    // Change event for dropdown
    $(document).on("change", "#share-dd-select", changeAnnoGrp);

    calcAnnCntOnPg();
}

// Descriptor function
function descriptor(event) {
    event.stopImmediatePropagation();
    $(this).toggleClass("active");
    // $(this).next(".weaver-container").toggle(500);
    if ($(this).hasClass("active")) {
        var notekey = $(this).closest(".note-dom").attr("id");

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
            var notekey = $(this).closest(".note-dom").attr("id");
            allnotes[notekey].description = {};
            allnotes[notekey].description['@context'] = "http://schema.org";

            var sel = $("#" + notekey + ".note-dom").find("#schemathingsdd option:selected").text();
            allnotes[notekey].description['@type'] = sel;

            $("#" + notekey + ".note-dom").find("form#descriptionInput :input").each(function () {
                //console.log(allnotes[notekey]);
                var input = $(this); // This is the jquery object of the input, do what you will

                allnotes[notekey].description[input[0].placeholder] = input[0].value;
            });

            if (userName !== null) {
                $.when(setServerAnno(notekey, allnotes[notekey], allnotes[notekey].sharedwith)).then($("#" + notekey + ".note-dom").find(".old-description").text(JSON.stringify(allnotes[notekey].description)));
            } else {
                $.when(setLocalAnno(notekey, allnotes[notekey])).then($("#" + notekey + ".note-dom").find(".old-description").text(JSON.stringify(allnotes[notekey].description)));
            }

        }

        function desclear(event) {
            var notekey = $(this).closest(".note-dom").attr("id");
            allnotes[notekey].description = {};

            if (userName !== null) {
                $.when(setServerAnno(notekey, allnotes[notekey], allnotes[notekey].sharedwith)).then($("#" + notekey + ".note-dom").find(".old-description").text(JSON.stringify(allnotes[notekey].description)));
            } else {
                $.when(setLocalAnno(notekey, allnotes[notekey])).then($("#" + notekey + ".note-dom").find(".old-description").text(JSON.stringify(allnotes[notekey].description)));
            }

        }

    } else {
        $(this).closest(".note-dom").children(".descriptor-container").remove();
    }
}

// Highlighter function
function glower(event) {
    event.stopImmediatePropagation();

    var notekey = $(this).closest(".note-dom").attr("id");

    function scrollIntoViewFunction(callback) {
        try {
            $("." + notekey + ".el-highlight").scrollIntoView();
        } catch (err) {
            console.log("Scroll into view failed!");
        }
        callback();
    }

    function glowTextFunction() {
        var anc = allnotes[notekey].anchor;
        var textAnc = [];
        var tempTextAnc = [];
        var ancMark = [];
        anc.forEach(function (val, idx) {
            if (anc[idx].annotated) {
                textAnc.push(anc[idx]);
                tempTextAnc.push(anc[idx]);
            }
        });

        var options = {};
        //var str;
        var fuzcon;
        var fuzsimData = {};
        var totalFuzSim = [];
        var i = 0;

        options.separateWordSearch = false;
        options.diacritics = false;
        options.debug = false;
        options.element = "wwmark";

        ckDupJson(aNotesonpage[notekey]);

        if (textAnc.length !== ancMark.length) {
            textAnc.forEach(function (val, idx) {
                var ancFnd = totalFuzSim.find(function (obj) {
                    return obj.idx === idx && obj.fnd === true;
                });
                if (!ancFnd) {
                    ancFnd = totalFuzSim.filter(function (obj) {
                        return obj.idx === idx && obj.fnd === false && obj.sim != undefined;
                    });
                    var topSim = Math.max.apply(Math, ancFnd.map(function (obj) {
                        return obj.sim;
                    }));

                    var str = textAnc[idx].nodeValue;
                    str = str.substr(textAnc[idx].startOffset, textAnc[idx].nodeValue.length - textAnc[idx].endOffset - textAnc[idx].startOffset);

                    indx = ancFnd.findIndex(function (obj) {
                        return obj.sim === topSim;
                    });

                    var nodStr = ancFnd[indx].nod.nodeValue;
                    var posInStr = nodStr.indexOf(str);
                    if (posInStr >= 0) {
                        ancMark.push({
                            aNod: ancFnd[indx].nod,
                            aStart: posInStr,
                            aLength: str.length
                        });
                    } else {
                        var len = str.length;
                        var posInTempStr = [];
                        for (var i = 1; i <= len; i++) {
                            var tempStr = str.substr(0, i);
                            if (nodStr.indexOf(tempStr) === -1) {
                                break;
                            } else {
                                posInTempStr.push(nodStr.indexOf(tempStr));
                            }
                        }
                        if (posInTempStr.length >= 1) {
                            ancMark.push({
                                aNod: ancFnd[indx].nod,
                                aStart: posInTempStr[posInTempStr.length - 1],
                                aLength: str.length
                            });
                        }
                    }

                    totalFuzSim = totalFuzSim.filter(function (obj) {
                        return obj.idx !== idx; // && obj.nod !== ancFnd[indx].nod;
                    });

                }
            });


        }

        ancMark.forEach(function (val, idx) {
            $(ancMark[idx].aNod).markRanges([{
                start: ancMark[idx].aStart,
                length: ancMark[idx].aLength
            }], options);
        });

        function ckDupJson(nod, ifNod) {
            if (nod.nodeName === "#text" && nod.parentElement.nodeName !== "MARK") {
                for (var idx = 0; idx < tempTextAnc.length; idx++) {
                    if (tempTextAnc[idx] !== undefined) {
                        fuzsimData = {};
                        totalFuzSim[i] = {};
                        fuzsimData.idx = idx;
                        fuzsimData.fnd = false;
                        if (tempTextAnc[idx].nodeValue == nod.nodeValue) {
                            ancMark.push({
                                aNod: nod,
                                aStart: tempTextAnc[idx].startOffset,
                                aLength: tempTextAnc[idx].nodeValue.length - tempTextAnc[idx].endOffset - tempTextAnc[idx].startOffset
                            });
                            fuzsimData.fnd = true;
                            tempTextAnc[idx] = undefined;
                        } else {
                            var str = tempTextAnc[idx].nodeValue;
                            str = str.substr(tempTextAnc[idx].startOffset, tempTextAnc[idx].nodeValue.length - tempTextAnc[idx].endOffset - tempTextAnc[idx].startOffset);

                            fuzcon = FuzzySet([tempTextAnc[idx].nodeValue], useLevenshtein = true);
                            var tempFS = fuzcon.get(nod.nodeValue, 0.00, 0.00);
                            if (tempFS !== 0) {
                                fuzsimData.nod = nod;
                                fuzsimData.sim = tempFS[0][0];
                            }
                        }
                        totalFuzSim[i] = fuzsimData;
                        i = i + 1;
                        if (fuzsimData.fnd === true) {
                            break;
                        }
                    }
                }
            }

            ifNod = (nod.contentWindow || nod.contentDocument);
            var chNod = nod.childNodes;
            if (ifNod) {
                try {
                    chNod = ifNod.document.childNodes;
                } catch (e) {
                    //console.log(e);
                }
            }

            if (chNod.length > 0) {
                var ln = chNod.length;
                for (var j = 0; j < ln; j++) {
                    ckDupJson(chNod[j], ifNod);
                }
            }
        }
    }

    function darkTextFunction() {
        $(aNotesonpage[notekey]).unmark();
    }

    function glowFunction() {
        $("." + notekey + ".el-highlight").addClass("el-highlight-glow").removeClass("el-highlight");
        glowTextFunction();
        setTimeout(function () {
            $("." + notekey + ".el-highlight-glow").addClass("el-highlight").removeClass("el-highlight-glow");
            darkTextFunction();
        }, 2000);
    }

    scrollIntoViewFunction(function () {
        glowFunction();
    });
}

//Reconstructor function
function reconstructor(event) {
    event.stopImmediatePropagation();
    $(this).toggleClass("active");

    var notekey = $(this).closest(".note-dom").attr("id");

    if ($(this).hasClass("active")) {
        $("body").children("#weaver-overlay").remove();
        $("body").append("<div id='weaver-overlay' class='woverlay-hide'><div class='woverlay-content'><div id='woverlay-toolbar'><div id='woverlay-close' class='ww ww-times' title='Close'></div><div id='woverlay-tog-bg' class='ww ww-toggle-off' title='Toggle Background'></div></div><div id='recnstrWindow' class='rcWin-bright'></div></div></div>");

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

        $("#woverlay-tog-bg").on("click", function () {
            $(this).toggleClass('ww-toggle-off ww-toggle-on');
            $("body").find("#recnstrWindow").toggleClass('rcWin-bright rcWin-dark');
        });

    }
}

// Linker function
function linker(event) {
    event.stopImmediatePropagation();
    var notekey = $(this).closest(".note-dom").attr("id");

    $(this).toggleClass("active");
    if ($(this).hasClass("active")) {
        var $linkerContainer = $("<div class='linker-container'> <div class='weaver-header'>Link Annotation</div> <div id='linkerSrcTool'><textarea id='linkerSrcBar' placeholder='Search'></textarea><div id='clrLSrcBar' class='ww ww-times lbutton' title='Clear Search'></div></div> </div>");
        $("#" + notekey + ".note-dom").append($($linkerContainer));

        if (Object.keys(allnotes).length <= 1) {
            $("#" + notekey + ".note-dom").children(".linker-container").append("<div id='noan'>no linkable annotations</div>");
        } else {
            $("#" + notekey + ".note-dom").find("#noan").remove();
            $("#" + notekey + ".note-dom").find(".linker-container").append("<div class='linker-content'></div>");
            $.each(allnotes, function (key) {
                if (notekey !== key) {
                    //alert(key);
                    var linksExist = false;
                    if (allnotes[notekey].links) {
                        linksExist = true;
                    } else {
                        linksExist = false;
                    }

                    if (linksExist) {
                        if (allnotes[notekey].links.indexOf(key) === -1) {
                            $("#" + notekey + ".note-dom").find(".linker-content").append("<div id=" + key + " class='linker-links'></div>");
                            $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").append($.templates.weaverLink.render(allnotes[key]));
                            $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").children(".weaver-options").append("<div id='link-up' class='linker-button ww ww-link' title='Add Link'></div>");
                        } else {
                            $("#" + notekey + ".note-dom").find(".linker-content").prepend("<div id=" + key + " class='linker-links'></div>");
                            $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").append($.templates.weaverLink.render(allnotes[key]));
                            $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").children(".weaver-options").append("<div id='link-up' class='linker-button ww ww-chain-broken' title='Remove Link'></div>");
                        }
                    } else {
                        $("#" + notekey + ".note-dom").find(".linker-content").append("<div id=" + key + " class='linker-links'></div>");
                        $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").append($.templates.weaverLink.render(allnotes[key]));
                        $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").children(".weaver-options").append("<div id='link-up' class='linker-button ww ww-link' title='Add Link'></div>");
                    }


                }
            });
        }
    } else {
        $(this).closest(".note-dom").children(".linker-container").remove();
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

        var crnotekey = $(this).closest(".note-dom").attr("id");
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
    var crnotekey = $(this).closest(".note-dom").attr("id");

    $.each($("#" + crnotekey + ".note-dom").find(".linker-links"), function (index, value) {
        $("#" + crnotekey + ".note-dom").find("#" + value.id + ".linker-links").show();
    });
    $(this).siblings("#linkerSrcBar")[0].value = "";

    $("#" + crnotekey + ".note-dom").find("#linkerSrcBar").focus();
}

// Transcludor function
function transcludor(event) {
    event.stopImmediatePropagation();
    var notekey = $(this).closest(".note-dom").attr("id");

    $(this).toggleClass("active");
    var key, transkey, $transcludorContainer;
    if (userName === null || allnotes[notekey].owner === userName) {
        if ($(this).hasClass("active")) {
            $transcludorContainer = $("<div class='transcludor-container'><div class='weaver-header'>Transclude Annotation</div><div id='transcludorTool'><div id='transView' class='ww ww-eye tbutton' title='View/Hide Transclusion' style='float:left!important'></div><div id='transRem' class='ww ww-minus tbutton' title='Remove Transclusion' style='float:right!important'></div><div id='transAdd' class='ww ww-plus tbutton' title='Add Transclusion' style='float:right!important'></div></div></div>");
            $("#" + notekey + ".note-dom").append($($transcludorContainer));

            if (allnotes[notekey].transclusion) {
                key = allnotes[notekey].transclusion;
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
            transkey = $(this).closest(".note-dom").children(".transcludor-container").find(".transcludor-links").attr("id");
            $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").remove();

            $(this).closest(".note-dom").children(".transcludor-container").remove();
        }
    } else {
        if ($(this).hasClass("active")) {
            if (allnotes[notekey].transclusion && allnotes[allnotes[notekey].transclusion]) {
                key = allnotes[notekey].transclusion;
                $transcludorContainer = $("<div class='transcludor-container'><div class='weaver-header'>Transclude Annotation</div><div id='transcludorTool'><div id='transView' class='ww ww-eye tbutton' title='View/Hide Transclusion' style='float:left!important'></div><div id='transRem' class='ww ww-minus tbutton' title='Remove Transclusion' style='float:right!important'></div><div id='transAdd' class='ww ww-plus tbutton' title='Add Transclusion' style='float:right!important'></div></div></div>");

                $("#" + notekey + ".note-dom").append($($transcludorContainer));

                $("#" + notekey + ".note-dom").children(".transcludor-container").append("<div class='transcluded-content'></div>");
                $("#" + notekey + ".note-dom").find(".transcluded-content").append("<div id=" + key + " class='transcludor-links'></div>");
                $("#" + notekey + ".note-dom").find(".transcluded-content").children("#" + key + ".transcludor-links").append($.templates.weaverLink.render(allnotes[key]));

                $("#" + notekey + ".note-dom").children(".transcludor-container").find("#transView").css('visibility', 'visible');
                $("#" + notekey + ".note-dom").children(".transcludor-container").find("#transAdd").css('visibility', 'hidden');
                $("#" + notekey + ".note-dom").children(".transcludor-container").find("#transRem").css('visibility', 'hidden');
            } else {
                $transcludorContainer = $("<div class='transcludor-container'><div class='weaver-header'>No transclusions to show</div></div>");

                $("#" + notekey + ".note-dom").append($($transcludorContainer));
            }
        } else {
            if (allnotes[notekey].transclusion) {
                key = allnotes[notekey].transclusion;
                if (allnotes[key]) {
                    transkey = $(this).closest(".note-dom").children(".transcludor-container").find(".transcludor-links").attr("id");
                    $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").remove();
                }
            }
            $(this).closest(".note-dom").children(".transcludor-container").remove();
        }
    }

    $(document).on("click", "#transAdd", showTransList);
    $(document).on("click", "#transRem", removeTrans);
    $(document).on("click", "#transView", viewTrans);
}

// Show Transclusion List
function showTransList(event) {
    event.stopImmediatePropagation();
    var notekey = $(this).closest(".note-dom").attr("id");

    if ($(this).closest(".transcludor-container").children("#transcludorSrcTool").length == 0) {
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
                    $("#" + notekey + ".note-dom").find("#" + key + ".transcludor-links").children(".weaver-options").append("<div id='trans-up' class='linker-button ww ww-plus' title='Transclude Annotation'></div>");
                }
            });
        }

    } else {
        $(this).closest(".transcludor-container").children("#transcludorSrcTool").remove();
        $(this).closest(".transcludor-container").children(".transcludor-content").remove();
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

        var transkey = $(this).closest(".note-dom").attr("id");
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
    var transkey = $(this).closest(".transcludor-links").attr("id");
    var notekey = $(this).closest(".note-dom").attr("id");

    allnotes[notekey].transclusion = transkey;
    var note = allnotes[notekey];

    if (userName !== null) {
        setServerAnno(notekey, note, note.sharedwith);
    } else {
        setLocalAnno(notekey, note);
    }

    var prElem = $(this).closest(".transcludor-container");
    prElem.append("<div class='transcluded-content'></div>");

    prElem.children(".transcluded-content").append("<div id=" + transkey + " class='transcludor-links'></div>");
    prElem.children(".transcluded-content").children("#" + transkey + ".transcludor-links").append($.templates.weaverLink.render(allnotes[transkey]));

    prElem.children("#transcludorSrcTool").remove();
    prElem.children(".transcludor-content").remove();

    $("#" + notekey + ".note-dom").find("#transView").css('visibility', 'visible');
    $("#" + notekey + ".note-dom").find("#transAdd").css('visibility', 'hidden');
    $("#" + notekey + ".note-dom").find("#transRem").css('visibility', 'visible');
}

// Remove Transclusion
function removeTrans(event) {
    event.stopImmediatePropagation();
    var notekey = $(this).closest(".note-dom").attr("id");
    var transkey = allnotes[notekey].transclusion;

    delete allnotes[notekey].transclusion;
    var note = allnotes[notekey];

    if (userName !== null) {
        setServerAnno(notekey, note, note.sharedwith);
    } else {
        setLocalAnno(notekey, note);
    }

    $(this).closest(".transcludor-container").children(".transcluded-content").remove();

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
    var transkey = $(this).closest(".note-dom").attr("id");

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
    var notekey = $(this).closest(".note-dom").attr("id");
    var transkey = allnotes[notekey].transclusion;

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
    $("." + notekey + ".el-highlight").prepend("<div id='" + transkey + "' class='transcludor-viewer'></div>");

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
                $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").append("<div id='trnVr-content'>" + XHrRes + "</div><div id='trnVr-toolbar'><div id='hideTrnVr' class='ww ww-eye-slash lbutton' title='Hide Transclusion' style='float: right;'></div><div id='refreshTrnVr' class='ww ww-refresh lbutton' title='Refresh Transclusion' style='float: right;'></div></div><div id='trnVr-banner'>" + "<b>* Transclusion Source: </b><i>" + hdrBaseUrl + hdrArgs + "</i>" + "</div>");
            } else {
                XHrRes = "Annotation orphaned!";
                $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").append("<div id='trnVr-content' style='color: red !important;'>" + XHrRes + "</div><div id='trnVr-toolbar'><div id='hideTrnVr' class='ww ww-eye-slash lbutton' title='Hide Transclusion' style='float: right;'></div><div id='refreshTrnVr' class='ww ww-refresh lbutton' title='Refresh Transclusion' style='float: right;'></div></div><div id='trnVr-banner'>" + "<b>* Transclusion Source: </b><i>" + hdrBaseUrl + hdrArgs + "</i>" + "</div>");
            }



            cnt++;
        }
        if (msg.status === 0 && cnt === 0) {
            XHrRes = "Could not connect to server! Please try again later.";

            $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").append("<div id='trnVr-content' style='color: red !important;'>" + XHrRes + "</div><div id='trnVr-toolbar'><div id='hideTrnVr' class='ww ww-eye-slash lbutton' title='Hide Transclusion' style='float: right;'></div><div id='refreshTrnVr' class='ww ww-refresh lbutton' title='Refresh Transclusion' style='float: right;'></div></div><div id='trnVr-banner'>" + "<b>* Transclusion Source: </b><i>" + hdrBaseUrl + hdrArgs + "</i>" + "</div>");

            cnt++;
        }
    });
}

// Hide Transcusion viewer
function hideTransView(event) {
    event.stopImmediatePropagation();
    var transkey = $(this).closest(".transcludor-viewer").attr("id");
    var notekey = $("#wanchs").find("#" + transkey + ".transcludor-links").closest(".note-dom").attr("id");

    $("." + notekey + ".el-highlight").find("#" + transkey + ".transcludor-viewer").remove();
    $("#" + notekey + ".note-dom").find("#transView").toggleClass("active");
}

// Refresh Transcusion viewer
function refreshTransView(event) {
    event.stopImmediatePropagation();
    var transkey = $(this).closest(".transcludor-viewer").attr("id");
    var notekey = $("#wanchs").find("#" + transkey + ".transcludor-links").closest(".note-dom").attr("id");

    loadTransclusion(notekey, transkey);
}

// Deleter function
function deleter(event) {
    event.stopImmediatePropagation();
    var notekey = $(this).closest(".note-dom").attr("id");
    var transkey = allnotes[notekey].transclusion;

    var elem = $("." + notekey + ".el-highlight")[0];
    var anncnt = 0;

    $($(elem).find('#' + transkey + '.transcludor-viewer')[0]).remove();

    delete allnotes[notekey];
    if (aNotesonpage[notekey]) {
        delete aNotesonpage[notekey];
        delete duppANOP[notekey];
    } else {
        delete oNotesonpage[notekey];
    }
    if (userName !== null) {
        removeServerAnno(notekey, allnotes[notekey].sharedwith);
    } else {
        removeLocalAnno(notekey);
    }


    if (elem) {
        elem.classList.forEach(function (dat, indx) {
            if (elem.classList[indx].substring(0, 3) === "ww-") {
                anncnt++;
            }
        });
    }

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
    var notekey = $(this).closest(".note-dom").attr("id");
    var note = allnotes[notekey];
    var commentkey = $(this).closest(".nhtext").attr("id");

    delete allnotes[notekey].oldnotes[commentkey];
    $.when(delete note.oldnotes[commentkey]).then(setLocalAnno(notekey, note));

    if (Object.keys(allnotes[notekey].oldnotes).length === 0) {
        $(this).closest(".weaver-old-comments").css("display", "none");
    }
    $(this).closest(".nhtext").remove();
}

// Render and store new comment
function newComment(event) {
    event.stopImmediatePropagation();
    if (event.keyCode === 13) {
        // event.stopImmediatePropagation();
        var notekey = $(this).closest(".note-dom").attr("id");
        var anNote = allnotes[notekey];
        var ts = moment().format();

        if (userName !== null) {
            if (!allnotes[notekey].oldnotes) {
                allnotes[notekey].oldnotes = {};
            }
            allnotes[notekey].oldnotes[ts] = {};
            allnotes[notekey].oldnotes[ts].addedby = userName;
            allnotes[notekey].oldnotes[ts].note = $(this).val();
            $.when(anNote.oldnotes[ts].note = $(this).val()).then(setServerAnno(notekey, anNote, anNote.sharedwith));
        } else {
            if (!allnotes[notekey].oldnotes) {
                allnotes[notekey].oldnotes = {};
            }
            allnotes[notekey].oldnotes[ts] = {};
            allnotes[notekey].oldnotes[ts].addedby = userName;
            allnotes[notekey].oldnotes[ts].note = $(this).val();
            $.when(anNote.oldnotes[ts].note = $(this).val()).then(setLocalAnno(notekey, anNote));
        }

        var $commentDOM = $("<div id='" + ts + "' class='nhtext'>" + anNote.oldnotes[ts].note + "<br><br><i style='font-size: 8px;'>" + moment(ts).format('lll') + "</i>" + "<b id='eraser' class='ww ww-times' aria-hidden='true' title='Delete Comment'></b> </div>");
        $(this).prev(".weaver-old-comments").css("display", "inline-block").append($commentDOM);
        $(this).val(null);
    }
}

// Linkup function
function linkUp(event) {
    event.stopImmediatePropagation();
    var tempkey = $(this).closest(".note-dom").attr("id");
    var tempnote = allnotes[tempkey];
    var templink = $(this).closest(".linker-links").attr("id");
    var j;
    var linkExists = false;
    if ($(this).hasClass("ww-link")) {
        if (userName !== null) {
            if (tempnote.links) {
                linkExists = true;
            } else {
                linkExists = false;
            }
            if (!linkExists) {
                tempnote.links = [];
            }
            $.when(tempnote.links.push(templink)).then(setServerAnno(tempkey, tempnote, tempnote.sharedwith));

        } else {
            $.when(tempnote.links.push(templink)).then(setLocalAnno(tempkey, tempnote));
        }
    } else {
        if (userName !== null) {
            j = tempnote.links.indexOf(templink);
            $.when(tempnote.links.splice(j, 1)).then(setServerAnno(tempkey, tempnote, tempnote.sharedwith));
        } else {
            j = tempnote.links.indexOf(templink);
            $.when(tempnote.links.splice(j, 1)).then(setLocalAnno(tempkey, tempnote));
        }

    }
    $(this).toggleClass('ww-link ww-chain-broken');
    if ($(this).hasClass('ww-link')) {
        $(this).attr('title', 'Add Link');
    } else {
        $(this).attr('title', 'Remove Link');
    }
}

// Function for Changing Anno Group
function changeAnnoGrp(event) {
    event.stopImmediatePropagation();
    var tempkey = $(this).closest(".note-dom").attr("id");
    var tempnote = allnotes[tempkey];
    var oldgrp = allnotes[tempkey].sharedwith;
    var newgrp = this.value;
    allnotes[tempkey].sharedwith = newgrp;
    setServerAnnoGrpChng(tempkey, tempnote, oldgrp, newgrp);
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

    if (userName !== null) {
        note.sharedwith = "Private";
        note.owner = userName;
    }
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
                    //console.log(e);
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


// Local Stograge Functions///////////////////////////////////////////////////////////////////////
// Set Local Data
function setLocalAnno(key, jsonData, callback) {
    var storeObj = {};
    storeObj[key] = jsonData;
    if (callback && typeof callback === "function") {
        chrome.storage.local.set(storeObj, callback);
    } else {
        chrome.storage.local.set(storeObj, function () {});
    }
}

// Get Local Data
function getLocalAnno(key, callback) {
    if (!callback || typeof callback !== "function")
        console.error("Please provide callback before calling getLocalAnno method.");
    else
        chrome.storage.local.get(key, callback);
}

// Remove Local Data
function removeLocalAnno(key) {
    chrome.storage.local.remove(key);
}
//////////////////////////////////////////////////////////////////////////////////////////////////


// Server Stograge Functions//////////////////////////////////////////////////////////////////////
// Set Server Data
function getServerAnno(callback) {
    var lgData = {};
    lgData.msg = "getData";
    chrome.runtime.sendMessage({ // Send message to background.js
        type: "checkServerData",
        data: lgData
    });
    callback();
}

// Store Server Data
function setServerAnno(key, annoData, shrdWth) {
    var lgData = {};
    lgData.msg = "setData";
    lgData.key = key;
    lgData.val = annoData;
    lgData.shrdWth = shrdWth;
    chrome.runtime.sendMessage({ // Send message to background.js
        type: "checkServerData",
        data: lgData
    });
}

// Store Server Data
function removeServerAnno(key, shrdWth) {
    var lgData = {};
    lgData.msg = "remData";
    lgData.key = key;
    lgData.shrdWth = shrdWth;
    chrome.runtime.sendMessage({ // Send message to background.js
        type: "checkServerData",
        data: lgData
    });
}

function setServerAnnoGrpChng(tempkey, tempnote, oldgrp, newgrp) {
    var lgData = {};
    lgData.msg = "chngAnnoGrp";
    lgData.key = tempkey;
    lgData.val = tempnote;
    lgData.oldgrp = oldgrp;
    lgData.newgrp = newgrp;
    chrome.runtime.sendMessage({ // Send message to background.js
        type: "checkServerData",
        data: lgData
    });
}
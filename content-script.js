var allnotes = {};

getData(null, function (items) {
    for (var key in items) {
        allnotes[key] = items[key];
    }
});

var aNotesonpage = {};
var oNotesonpage = {};
var loaded = false;
var wselectedanchor = {};
var wselectedtext;
var wselectedelement;

// Stop HREFs from re-directing on note-dom click events/////////////////////////////////////////////////////////////////////////////
$("a").on("click", function (e) {
    if ($(".note-dom").find(e.target).length !== 0) {
        e.preventDefault();
    }
});


// Bubble functions/////////////////////////////////////////////////////////////////////////////
chrome.runtime.onMessage.addListener(function (msg, sender) {
    if (msg === "render-dash") {
        renderDash();
    }
    //if (msg === "render-old") {
    //    renderOldNotes();
    //}
    if (msg === "add-bubble") {
        addBubble();
    }
});

//Render dashboard
function renderDash() {
    $("body").append($.templates["dashDOM"].render());

    $("#warrow").on("click", function () {
        $("#warrow").toggleClass('ww-angle-right ww-angle-left');
        $("#weaver-dash").toggleClass('weaver-dash-max weaver-dash-min');
        $("#weaver-toolbar").toggle();
    });

    $("#wfade").on("click", function () {
        $("#wfade").toggleClass('wlight wdark');
        $("#weaver-dash").toggleClass('wd-opa wd-trans');
    });

    $("#wwebodata").on("click", function () {
        $("#wwebodata").toggleClass('wlight wdark');
        renderWebodata();
    });

    /*$("#wtarget").on("click", function () {
    $("#wtarget").toggleClass('wlight wdark');
    EVENT------------------------------------
    });*/

    /*$("#wshowhide").on("click", function () {
        $("#wshowhide").toggleClass('wlight wdark');
        $("#wshowhide").toggleClass('ww-toggle-on ww-toggle-off');
    });*/

    $("#wanchTab").on("click", function () {
        wopenTab(event, 'wanchs');
        renderOldNotes();
    });
    $("#woanchTab").on("click", function () {
        wopenTab(event, 'woanchs');
    });
    $("#wbrowTab").on("click", function () {
        wopenTab(event, 'wbrows');
        renderBrowTab();
    });

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

    $("#wanchTab").trigger("click");
    $("#warrow").trigger("click");
}

//Render Browser Tab
function  renderBrowTab() {
    $("#wbrows.wtabcontents").empty();
    $.each( allnotes, function( notekey ) {
        $("#wbrows.wtabcontents").append("<div id=" + notekey + " class='browser-container'></div>");
        $("#" + notekey + ".browser-container").append($.templates["browserNote"].render(allnotes[notekey]));

        $("#" + notekey + ".browser-container").click(function() {

            var tempUrl = allnotes[notekey].urlProtocol + "//" + allnotes[notekey].urlHost + allnotes[notekey].urlPathname + allnotes[notekey].urlParameter;

            window.open(tempUrl);
        });

        Object.keys(allnotes[notekey].oldnotes).forEach(
            function(key) {
                var k = key;
                var v = allnotes[notekey].oldnotes[k];
                var $browserComment = $("<div id='" + k + "' class='nhtext'>" + v + "<br><i style='font-size: 8px;'>" + moment(k).format('lll') + "</i>" + "</div>");
                $("#" + notekey + ".browser-container").children(".browser-old-comments").append($browserComment);
            });
    });
}

//Render WebOfData Tab
function renderWebodata() {
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

    Array.prototype.unique = function() {
        var arr = [];
        for(var i = 0; i < this.length; i++) {
            if(!arr.includes(this[i])) {
                arr.push(this[i]);
            }
        }
        return arr; 
    };

    var urlGroup = nodeUrl.unique();

    nodeArr.forEach(
        function(nodeElem) {
            //alert(key);
            var webodNodeElement = {};
            webodNodeElement.id = nodeArr.indexOf(nodeElem);

            var tempUrl = allnotes[nodeElem].urlProtocol + "//" + allnotes[nodeElem].urlHost + allnotes[nodeElem].urlPathname + allnotes[nodeElem].urlParameter;
            webodNodeUrl.push(tempUrl);
            
            webodNodeElement.value = Object.keys(allnotes[nodeElem].oldnotes).length;
            webodNodeElement.group = urlGroup.indexOf(allnotes[nodeElem].urlHost);
            webodNodeElement.label = tempUrl;
            webodNodeElement.title = allnotes[nodeElem].selectedtext + "<br/><br/><i style='float: right;'>" + allnotes[nodeElem].addedon + "</i>";
            webodNodes.push(webodNodeElement);

            var edgeArr = allnotes[nodeElem].links;

            edgeArr.forEach(
                function(edgeElem) {
                    //alert(lkey);
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
            improvedLayout: true
        },
        edges: {
            arrows: 'to',
            color: { inherit: true },
            smooth: {type: 'continuous' }
        },
        nodes: {
            shape: 'dot',
            widthConstraint: { maximum: 150 },
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
}


// Render old notes
function renderOldNotes() {
    // $.holdReady( false );
    for (var key in allnotes) {
        var tempUrl = allnotes[key].urlProtocol + "//" + allnotes[key].urlHost + allnotes[key].urlPathname + allnotes[key].urlParameter; //URL of Notes
        if (tempUrl === window.location.href) { //Check if Note URLs are same as current DOM
            var anr = allnotes[key].anchor; //Notes previously saved on URL 
            var anrlen = anr.length; //Number of notes saved on URL
            var wpg = []; //Array to save DOM nodes
            var iden;

            if (anr[0].id) {
                //iden = anr[0].nodeName + "#" + anr[0].id;
                //wpg = $(iden);
                wpg = document.getElementById (anr[0].id); //Check Anchor--DOM node's ID
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

            //console.log("Anchor: ", anr );

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
            //console.log("Mat: ", mat);
            //console.log("Mis: ", mis);


            // Compare Anchored Nodes to DOM Nodes
            function jsonCompare(node) {
                if (node.nodeName !== "HEAD" && node.nodeName !== "SCRIPT" && node.nodeName !== "NOSCRIPT" && node.nodeType !== 8 && node.nodeType !== 10) { //Ignore if node is 'HEAD, SCRIPT or other unusable types'
                    var j;
                    for (j = 0; j < tempanr.length; j++) { //Repeat for all elements in Anchor node
                        var kvp = Object.keys(tempanr[j]);

                        if (tempanr[j].nodeName !== '#text' && node.nodeName !== '#text') { //Match 'non-text' elements
                            var fnd = 0;
                            for (var k = 0; k < kvp.length; k++) { //Repeat for all properties of Anchor node elements
                                if (kvp[k] !== 'nodeDepth' && tempanr[j][kvp[k]] === node[kvp[k]]) {
                                    fnd = fnd + 1 / (kvp.length - 1);
                                }
                            }

                            if (fnd === 1) { //If all properties match
                                mat[i] = (mat[i]*100 + 1*100)/100;
                                tempanr.splice(j, 1); //Remove match element from Anchor node instance
                                break;
                            } else { //If some properties dont match
                                fnd = fnd.toFixed(2); //Round value to second decimal place
                                mis[i] = (mis[i]*100 + (1 - fnd)*100)/100;
                            }                            
                        }

                        if (tempanr[j].nodeName === '#text' && node.nodeName === '#text') {  //Match 'text' elements
                            var fuzsim;
                            if (tempanr[j].nodeValue === node.nodeValue) { //If all contents match
                                mat[i] = (mat[i]*100 + 1*100)/100;
                                tempanr.splice(j, 1); //Remove match content from Anchor node instance
                                break;
                            } else { //If some contents dont match
                                var fuzcon = FuzzySet([tempanr[j].nodeValue], useLevenshtein = true); //FUZZY TEXT MATCHING
                                if (fuzcon.get(node.nodeValue)) {
                                    fuzsim = (fuzcon.get(node.nodeValue)[0][0]).toFixed(2); //Round value to second decimal place
                                } else {
                                    fuzsim = 0;
                                }

                                if(fuzsim >= 0.5) { //If more than 50% contents match
                                    mat[i] = (mat[i]*100 + fuzsim*100)/100;
                                    tempanr.splice(j, 1);  //Remove match content from Anchor node instance
                                    break;
                                } else { //If less than 50% contents match
                                    mis[i] = (mis[i]*100 + (1 - fuzsim)*100)/100;
                                }
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

            var minMis = Math.min.apply(Math, mis);

            function indexesOf(myWord, myLetter) {
                var indexes = new Array();
                for (var i = 0; i < myWord.length; i++) {
                    if (myWord[i] === myLetter) {
                        indexes.push(i);
                    }
                }
                return indexes;
            }

            var iMINmis = indexesOf(mis, minMis);
            var arrMAXmat = [];

            iMINmis.forEach(
                function(indx) {
                    arrMAXmat.push(mat[indx]);
              }
            );

            var iMAXmat = iMINmis[arrMAXmat.indexOf(Math.max.apply(Math, arrMAXmat))];

            if (mat[iMAXmat]/anr.length >= 0.7) {
                var elem = wpg[iMAXmat];

                aNotesonpage[notekey] = elem;
    
                var $noteDOM = $("<div id='" + notekey + "' class='note-dom'></div></div>");
                $("#wanchs").prepend($noteDOM);
                $("#" + notekey + ".note-dom").append($.templates["weaverNote"].render(note));
    
                $("#" + notekey + ".note-dom").children(".weaver-container").append("<div id='sim-index' class='weaver-header' style='text-align: left !important;'>Similarity Index: " + mat[iMAXmat]/anr.length + "</div>");

                var arr = $.map(note.oldnotes, function (value, key) {
                    return [
                        [key, value]
                    ];
                });
    
                for (i = 0; i < arr.length; i++) {
                    var $commentDOM = $("<div id='" + arr[i][0] + "' class='nhtext'>" + arr[i][1] + "<br><i style='font-size: 8px;'>" + moment(arr[i][0]).format('lll') + "</i>" + "<b id='eraser' class='ww ww-times' aria-hidden='true' title='Delete Comment'></b> </div>");
                    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-old-comments").css("display", "inline-block").append($commentDOM);
                }
    
                $(elem).addClass("el-highlight").addClass(notekey);

                $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-anno").css("cursor", "pointer");
    
                // Click event
                $(document).on("click", ".weaver-anno", helem);

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
            } else { 
                var $noteDOM = $("<div id='" + notekey + "' class='note-dom'></div></div>");
                $("#woanchs").prepend($noteDOM);
                $("#" + notekey + ".note-dom").append($.templates["weaverNote"].render(note));
    
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
}

// Add bubble to website DOM
function addBubble() {
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

    $(document).bind("ajaxComplete", function () {
        renderOldNotes();
    });
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

    wselectedanchor.startNode = wselection.anchorNode.nodeValue;
    wselectedanchor.startOffset = wselection.anchorOffset;
    wselectedanchor.endNode = wselection.focusNode.nodeValue;
    wselectedanchor.endOffset = wselection.focusOffset;

    if (wselection.anchorNode === wselection.focusNode) {
        wselectedanchor.oneNode = true;
    } else {
        wselectedanchor.oneNode = false;
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
    /////////////////////////////////////////////////////////
}


// Note Functions/////////////////////////////////////////////////////////////////////////////
// Render new note
function renderNewNote(elem) {
    var note = createNewNote();
    var notekey = genNoteKey();
    note.anchor = elemJSON(elem, wselectedanchor);

    var $noteDOM = $("<div id='" + notekey + "' class='note-dom'></div>");

    $("#wanchs").prepend($noteDOM);
    $("#" + notekey + ".note-dom").append($.templates["weaverNote"].render(note));

    allnotes[notekey] = note;
    storeData(notekey, note);

    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-new-comments").focus();

    $("#" + notekey + ".note-dom").children(".weaver-container").children(".weaver-anno").css("cursor", "pointer");
    
    $(elem).addClass("el-highlight").addClass(notekey);

    // Click event
    $(document).on("click", ".weaver-anno", helem);

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

// Descriptor function
function descriptor(event) {
    event.stopImmediatePropagation();
    $(this).toggleClass("active");
    // $(this).next(".weaver-container").toggle(500);
    if ($(this).hasClass("active")) {
        var notekey = $($(this).offsetParent()).offsetParent().attr("id");

        $("#" + notekey + ".note-dom").append($.templates["descriptorContainer"].render());

        $("#" + notekey + ".note-dom").find(".old-description").text(JSON.stringify(allnotes[notekey].description));

        $("#" + notekey + ".note-dom").find("#schemathingsdd").change(function (value) {
            $("#" + notekey + ".note-dom").find("#descriptionInput").html("");
            var sel = $("#" + notekey + ".note-dom").find("#schemathingsdd option:selected").text();
            switch (sel) {
                case 'CreativeWork':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates["crwO"].render());
                    break;
                case 'Event':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates["eveN"].render());
                    break;
                case 'Organization':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates["orgA"].render());
                    break;
                case 'Person':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates["perS"].render());
                    break;
                case 'Place':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates["plaC"].render());
                    break;
                case 'Product':
                    $("#" + notekey + ".note-dom").find("#descriptionInput").html($.templates["proD"].render());
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
function helem(event) {
    event.stopImmediatePropagation();

    var notekey = $($(this).offsetParent()).offsetParent().attr("id");

    var targetElem = $("." + notekey + ".el-highlight");
    //scrollIntoView(targetElem, {time: 1000});

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

        var anrElem = allnotes[notekey].anchor;
        var recnstrAnchor = '';

        var prnt = [];

        anrElem.forEach(
            function (val) {

                if (val.nodeName === "#text") {
                    recnstrAnchor = recnstrAnchor + val.nodeValue;
                } else {
                    recnstrAnchor = recnstrAnchor + "<" + val.nodeName;
                    if (val.id) { recnstrAnchor = recnstrAnchor + " id='" + val.id + "'"; }
                    if (val.className) { recnstrAnchor = recnstrAnchor + " class='" + val.className + "'"; }
                    if (val.alt) { recnstrAnchor = recnstrAnchor + " alt='" + val.alt + "'"; }
                    if (val.href) { recnstrAnchor = recnstrAnchor + " href='" + val.href + "'"; }
                    if (val.src) { recnstrAnchor = recnstrAnchor + " src='" + val.src + "'"; }
                    recnstrAnchor = recnstrAnchor + ">";
                }
                    if (anrElem.indexOf(val) < anrElem.length - 1) {
                        if (val.nodeDepth < anrElem[anrElem.indexOf(val) + 1].nodeDepth) {
                            prnt.push(val.nodeName);
                        } else {
                            if (val.nodeName !== "#text") {recnstrAnchor = recnstrAnchor + "</" + val.nodeName + ">";}
                            if (val.nodeDepth > anrElem[anrElem.indexOf(val) + 1].nodeDepth) {

                                var d = val.nodeDepth - anrElem[anrElem.indexOf(val) + 1].nodeDepth;
                                for (; d > 0; d--) {
                                    recnstrAnchor = recnstrAnchor + "</" + prnt[prnt.length - 1] + ">";
                                    prnt.splice(prnt.length - 1, 1);
                                }
                            }
                        }
                    } else {
                        if (val.nodeName !== "#text") {recnstrAnchor = recnstrAnchor + "</" + val.nodeName + ">";}
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
    $(this).toggleClass("active");
    if ($(this).hasClass("active")) {
        var notekey = $($(this).offsetParent()).offsetParent().attr("id");

        var $linkerContainer = $("<div class='linker-container'> <div class='weaver-header'>Link Note</div> </div>");
        $("#" + notekey + ".note-dom").append($($linkerContainer));
        
        if (Object.keys(allnotes).length <= 1) {
            $("#" + notekey + ".note-dom").children(".linker-container").append("<div id='noan'>no linkable annotations</div>");
        }
        else {
            $("#" + notekey + ".note-dom").find("#noan").remove();
            $("#" + notekey + ".note-dom").find(".linker-container").append("<div class='linker-content'></div>");
            $.each( allnotes, function( key ) {
                if (notekey !== key)
                {
                    $("#" + notekey + ".note-dom").find(".linker-content").append("<div id=" + key + " class='linker-links'></div>");
                    $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").append($.templates["weaverLink"].render(allnotes[key]));
                    //alert(key);
                    if (allnotes[notekey].links.indexOf(key) === -1) {
                        $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").children(".weaver-options").append("<div id='link-up' class='linker-button ww ww-link ww-flip-horizontal' title='Add Link'></div>");
                    }
                    else {
                        $("#" + notekey + ".note-dom").find("#" + key + ".linker-links").children(".weaver-options").append("<div id='link-up' class='linker-button ww ww-chain-broken ww-flip-horizontal' title='Remove Link'></div>");
                    } 

                }
              });
        }
    } else {
        $(this).offsetParent().siblings(".linker-container").remove();
    }

    $(document).on("click", "#link-up", linkUp);
}

// Deleter function
function deleter(event) {
    event.stopImmediatePropagation();
    var notekey = $($(this).offsetParent()).offsetParent().attr("id");

    delete allnotes[notekey];
    removeData(notekey);

    $("." + notekey + ".el-highlight").removeClass("el-highlight").removeClass(notekey);
    $("#" + notekey + ".note-dom").remove();
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
    if( $(this).hasClass('ww-link')) { $(this).attr('title', 'Add Link'); }
    else { $(this).attr('title', 'Remove Link'); }
}


// New note functions/////////////////////////////////////////////////////////////////////////////
// Create new note
function createNewNote() {
    var note = {};
    var tempUrl = window.document.location.href.toString();
    note["urlProtocol"] = window.document.location.protocol.toString();
    note["urlHost"] = window.document.location.host.toString();
    note["urlPathname"] = window.document.location.pathname.toString();
    note["urlParameter"] = (tempUrl.substring( note["urlProtocol"].length + 2 + note["urlHost"].length + note["urlPathname"].length )).toString();
    note["selectedtext"] = wselectedtext;
    note["addedon"] = moment().format('LLL');
    note["anchor"] = [];
    note["oldnotes"] = {};
    note["links"] = [];
    note["description"] = {};
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
    var d = 0;
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

            if (node.className !== "") {
                nodeDataArray[i].className = node.className;
            }

            try {
                if (Object.keys(node.dataset).length !== 0) {
                    nodeDataArray[i].dataset = JSON.stringify(node.dataset);
                }
            } catch (err) {}

            nodeDataArray[i].nodeDepth = d;

            if (node.nodeValue) {
                nodeDataArray[i].nodeValue = node.nodeValue;
                //var instance = new Mark(node);
                //instance.mark("Lorem ipsum");

                if (wselectedanchor.oneNode && node.nodeValue === wselectedanchor.startNode) {
                    nodeDataArray[i].annotated = true;
                    nodeDataArray[i].startOffset = wselectedanchor.startOffset;
                    nodeDataArray[i].endOffset = wselectedanchor.endNode.length - wselectedanchor.endOffset;
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
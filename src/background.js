console.log("background running");
var focusing = false;

chrome.runtime.onMessage.addListener(function(text) {
    if (text === "started session") {
        focusing = true;
        console.log(text);
    } else if (text === "end session") {
        focusing = false;
        console.log(text);
    }});

chrome.tabs.onUpdated.addListener( function(tab) {
    if (focusing) {
        chrome.tabs.query({active: true, currentWindow: true},
        function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, "continue session");});};})


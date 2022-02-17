console.log("background running");
var start = new Date();
var focusing = false;

chrome.runtime.onMessage.addListener(function(text) {
    if (text === "started session") {
        focusing = true;
        console.log(text);
        timer();
    } else if (text === "end session") {
        focusing = false;
        console.log(text);
    }});

chrome.tabs.onUpdated.addListener( function(tab) {
    if (focusing) {
        chrome.tabs.query({active: true, currentWindow: true},
        function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, "continue session");});};})

function timer() {
    start = new Date();
    var sec = 30;
    var timer = setInterval(function () {
    var currentSecondsPassed = ((new Date).getTime() - start) / 1000;
    console.log(currentSecondsPassed);
    if (sec - currentSecondsPassed < 0) {
        clearInterval(timer);
        chrome.tabs.query({}, function (tabs) {
                 tabs.forEach(function (tab) {
                     chrome.tabs.sendMessage(tab.id, "time is up");
                 });
            });
        focusing = false;
        }
    }, 1000);
}



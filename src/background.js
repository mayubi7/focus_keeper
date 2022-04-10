console.log("background running");
var focusing = false;
var sessionDuration = 25;
var startTime = null;

chrome.runtime.onMessage.addListener(function(text) {
    if (text === "started session") {
        focusing = true;
        console.log(text);
        scheduleSession();
    } else if (text === "end session") {
        focusing = false;
        console.log(text);
        endSession();
    } else if (text === "focusing"){
        focusing = true;
    }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    console.log("Got an alarm", alarm);
    focusing = false;
    chrome.storage.sync.set({
        isFocusing: focusing,
    });
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "focus completed"));
    });
});

chrome.tabs.onUpdated.addListener(function(tab) {
    if (focusing) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, "continue session");
        });
    }
});

function scheduleSession() {
    startTime = (new Date()).getTime();
    chrome.alarms.create("pomodoro",{delayInMinutes: sessionDuration});
    console.log("Alarm created!");
    console.log(new Date());
    chrome.storage.sync.set({
        sessionDuration: sessionDuration,
        startTime: startTime,
        isFocusing: focusing,
    });
}

function endSession() {
    chrome.alarms.clearAll();
    chrome.storage.sync.set({
        sessionDuration: sessionDuration,
        startTime: null,
        isFocusing: false,
    });
    console.log("Session Ended. Storage updated.");
}






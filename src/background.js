console.log("background running");
let focusing = false;
let sessionDuration = 1;
let startTime = null;
let paused = false;
let secondsPassedFocusing = 0;
let secondsRemaining = null;

chrome.runtime.onMessage.addListener(function(text) {
    if (text === "started session") {
        focusing = true;
        console.log(text);
        scheduleSession();
    } else if (text === "end session") {
        focusing = false;
        console.log(text);
        endSession();
    } else if (text === "focusing") {
        focusing = true;
    } else if (text === "pause session") {
        focusing = false;
        paused = true;
        console.log(text);
        pauseSession();
    } else {
        console.log(text);
    }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    console.log("Got an alarm", alarm);
    chrome.storage.sync.set({
        isFocusing: false,
        startTime: null,
        endTime: null,
        isPaused: false,
        secsFocused: 0,
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
    endTime = startTime + (1000 * 60 * sessionDuration);
    if (!paused) {
        chrome.alarms.create("pomodoro",{delayInMinutes: sessionDuration});
        console.log("Alarm created!");
        chrome.storage.sync.set({
            sessionDuration: sessionDuration,
            startTime: startTime,
            endTime: endTime,
            isFocusing: focusing,
            isPaused: false,
            secsFocused: 0,
        });
    } else {
        chrome.storage.sync.get(['secsFocused'], function (session) {
            secondsPassedFocusing = session.secsFocused;
            secondsRemaining = 60 * sessionDuration - secondsPassedFocusing;
            endTime = (new Date()).getTime() + (1000 * secondsRemaining);
            chrome.storage.sync.set({
                endTime: endTime,
                isFocusing: true,
                isPaused: false,
            })
        });
    }
}

function endSession() {
    chrome.alarms.clearAll();
    chrome.storage.sync.set({
        sessionDuration: sessionDuration,
        startTime: null,
        endTime: null,
        isFocusing: false,
        isPaused: false,
        secsFocused: 0,
    });
    console.log("Alarm cleared.");
    console.log("Session Ended. Storage updated.");
}

function pauseSession() {
    chrome.alarms.clearAll();
    chrome.storage.sync.set({
            sessionDuration: sessionDuration,
            startTime: startTime,
            isFocusing: true,
        });
    console.log("Alarm cleared.");
}






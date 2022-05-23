console.log("background running");

let focusing = false;
let sessionDuration = 5;
let startTime = null;
let endTime = null;
let paused = false;
let secondsPassedFocusing = 0;
let secondsRemaining = null;
let sessionsToday = [];
let session = null;

chrome.runtime.onInstalled.addListener(function () {
   chrome.storage.sync.set({"sessionsCompletedToday": sessionsToday});
});

chrome.runtime.onMessage.addListener(function (text, sender, sendResponse) {
    sendResponse({status: "ok"});
    if (text === "started session") {
        startSession();
    } else if (text === "end session") {
        focusing = false;
        endSession();
    } else if (text === "pause session") {
        pauseSession();
    } else {
        console.log(text);
    }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    console.log("Got an alarm", alarm);

    focusing = false;
    startTime = null;
    endTime = null;
    paused = false;
    secondsPassedFocusing = 0;

    session.startTime = startTime;
    session.endTime = endTime;
    session.isFocusing = focusing;
    session.isPaused = paused;
    session.secsFocused = secondsPassedFocusing;

    chrome.storage.sync.set({"currentSession": session});
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "focus completed"));
    });
});

 chrome.tabs.onUpdated.addListener( function(tabId, changeInfo, tab) {
    chrome.storage.sync.get(['currentSession'], function (data) {
        focusing = data.currentSession.isFocusing;
        paused = data.currentSession.isPaused;
        if (tab.url === "chrome://newtab/" || tab.url.match("chrome://") || tab.url.match("chrome-extension://")) {
            return;
        }
        if (focusing && !paused && changeInfo.status === "complete" && tab.url.match("http")) {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, "continue session");
            });
        }
    });
});

function startSession() {
    startTime = (new Date()).getTime();
    endTime = startTime + (1000 * 60 * sessionDuration);
    focusing = true;
    chrome.storage.sync.get(['currentSession'], function (data) {
        paused = data.currentSession.isPaused;
        if (!paused) {
            scheduleSession();
        } else {
            resumeSession();
        }
    });
}

function scheduleSession() {
    session = {
        sessionDuration: sessionDuration,
        startTime: startTime,
        endTime: endTime,
        isFocusing: focusing,
        isPaused: paused,
        secsFocused: secondsPassedFocusing
    }
    console.log("Session.isFocusing" + session.secsFocused);
    chrome.alarms.create("pomodoro",{delayInMinutes: sessionDuration});
    chrome.storage.sync.set({"currentSession": session});
}

function resumeSession() {
    chrome.storage.sync.get(['currentSession'], function (data) {
        secondsPassedFocusing = data.currentSession.secsFocused;
        console.log(" RESUMING SESSION secondsPassedFocusing:" + secondsPassedFocusing);
        secondsRemaining = 60 * sessionDuration - secondsPassedFocusing;
        endTime = (new Date()).getTime() + (1000 * secondsRemaining);

        focusing = true;
        paused = false;

        session = {
                sessionDuration: sessionDuration,
                startTime: startTime,
                endTime: endTime,
                isFocusing: focusing,
                isPaused: paused,
                secsFocused: secondsPassedFocusing
        }

        chrome.storage.sync.set({"currentSession": session});
    });
}


function endSession() {
    chrome.alarms.clearAll();

    focusing = false;
    startTime = null;
    endTime = null;
    paused = false;
    secondsPassedFocusing = 0;

    session = {
            sessionDuration: sessionDuration,
            startTime: startTime,
            endTime: endTime,
            isFocusing: focusing,
            isPaused: paused,
            secsFocused: secondsPassedFocusing
        }

    chrome.storage.sync.set({"currentSession": session});
    console.log("Alarm cleared.");
    console.log("Session Ended. Storage updated.");
}

function pauseSession() {
    chrome.alarms.clearAll();
    focusing = false;
    paused = true;

    console.log("Alarm cleared.");
}






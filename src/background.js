console.log("background running");

let focusing = false;
let sessionDuration = 25;
let startTime = null;
let endTime = null;
let paused = false;
let secondsPassedFocusing = 0;
let secondsRemaining = null;
let sessionsToday = [];
let session = null;

chrome.runtime.onInstalled.addListener(function () {
    let currentSession = {
        sessionDuration: sessionDuration,
        startTime: 0,
        endTime: 0,
        isFocusing: false,
        isPaused: false,
        secsFocused: 0
        };
   chrome.storage.sync.set({
   "sessionsCompletedToday": sessionsToday,
   "currentSession": currentSession,
   "week": 0,
   "sunday": 0,
   "monday": 0,
   "tuesday": 0,
   "wednesday": 0,
   "thursday": 0,
   "friday": 0,
   "saturday": 0
   });
});

chrome.runtime.onMessage.addListener(function (text, sender, sendResponse) {
    sendResponse({status: "message received"});
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

function startSession() {
    setStartingSessionProperties();
    chrome.storage.sync.get(['currentSession'], function (data) {
        paused = data.currentSession.isPaused;
        if (!paused) {
            scheduleSession();
        } else {
            resumeSession();
        }
    });
}

function setStartingSessionProperties() {
    startTime = (new Date()).getTime();
    endTime = startTime + (1000 * 60 * sessionDuration);
    focusing = true;
}

function scheduleSession() {
    createAlarm();
    saveSessionToStorage();
}

function createAlarm() {
    chrome.alarms.create("pomodoro",{delayInMinutes: sessionDuration});
}

function saveSessionToStorage() {
    session = {
        sessionDuration: sessionDuration,
        startTime: startTime,
        endTime: endTime,
        isFocusing: focusing,
        isPaused: paused,
        secsFocused: secondsPassedFocusing
    }
    chrome.storage.sync.set({"currentSession": session});
    getSessionFromStorage();
}

function getSessionFromStorage() {
    chrome.storage.sync.get(['currentSession'], function (data) {
        currentSession = data.currentSession;
    });
}

function resumeSession() {
    chrome.storage.sync.get(['currentSession'], function (data) {
        currentSession = data.currentSession;
        setResumingSessionProperties();
        createAlarmWhenResuming();
        saveSessionToStorage();
    });
}

function createAlarmWhenResuming() {
    chrome.alarms.create("pomodoro", {
        when: endTime
    });
}

function setResumingSessionProperties() {
    startTime = currentSession.startTime;
    secondsPassedFocusing = currentSession.secsFocused;
    secondsRemaining = 60 * sessionDuration - secondsPassedFocusing;
    endTime = (new Date()).getTime() + (1000 * secondsRemaining);
    focusing = true;
    paused = false;
}


function endSession() {
    clearAlarms();
    setEndingSessionProperties();
    saveSessionToStorage();
}

function clearAlarms() {
    chrome.alarms.clearAll();
}

function setEndingSessionProperties() {
    focusing = false;
    startTime = null;
    endTime = null;
    paused = false;
    secondsPassedFocusing = 0;
}

function pauseSession() {
    clearAlarms();
    setPausingSessionProperties();
}

function setPausingSessionProperties() {
    focusing = false;
    paused = true;
}

chrome.alarms.onAlarm.addListener(function (alarm) {
    saveCompletedToSessionsToday();
    setDefaultSessionProperties();
    saveSessionToStorage();
    sendCompletedSessionMessage();

});

function saveCompletedToSessionsToday() {
    chrome.storage.sync.get(['currentSession','sessionsCompletedToday'], function (data) {
        currentSession = data.currentSession;
        sessionsToday = data.sessionsCompletedToday;
        sessionsToday.push(currentSession);
        chrome.storage.sync.set({"sessionsCompletedToday": sessionsToday});
    });
}

function setDefaultSessionProperties() {
    focusing = false;
    startTime = null;
    endTime = null;
    paused = false;
    secondsPassedFocusing = 0;
}

function sendCompletedSessionMessage() {
    chrome.tabs.query({url: "https://*/*"}, function(tabs) {
        tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, "focus completed");
        });
    });
}

chrome.tabs.onUpdated.addListener( function(tabId, changeInfo, tab) {
    chrome.storage.sync.get(['currentSession'], function (data) {
        currentSession = data.currentSession;
        focusing = currentSession.isFocusing;
        paused = currentSession.isPaused;
        if (tab.url === "chrome://newtab/" || tab.url.match("chrome://") || tab.url.match("chrome-extension://")) {
            return;
        } else if (focusing && !paused && changeInfo.status === "complete" && tab.url.match("http")) {
            sendContinueSessionMessage();
        }
    });
});

function sendContinueSessionMessage() {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, "continue session");
    });
}






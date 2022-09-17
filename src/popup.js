const focusBtn = document.querySelector(".focus-btn");
const pauseBtn = document.querySelector(".pause-btn");
const endBtn = document.querySelector(".end-btn");
const timer = document.querySelector(".timer");
const rightBtn = document.querySelector(".navigation-btns .right-btn");
const leftBtn = document.querySelector(".navigation-btns .left-btn");
const views = document.querySelectorAll(".card-view .view");
const viewsContainer = document.querySelector(".card-view .views");
const dots = document.querySelectorAll(".card-view .dot");
const rightArrow = document.querySelector(".right .right-arrow");
const leftArrow = document.querySelector(".left .left-arrow");
const hours = document.querySelectorAll(".hour-container .hour");
const date = document.querySelector(".hourly-view .date");
const week = document.querySelector(".weekly-view .week ");
const weekdays = document.querySelectorAll(".chart-container .day-data");
const totalTimes = document.querySelectorAll(".chart-container .total-time");
let progressBar = document.querySelector(".main-circle");

let timerDisplay;
let focusing;
let sessionDuration;
let startTime;
let endTime;
let displayMins;
let displaySecs;
let progressValue;
let currentSession;
let weekOfTheYear;
let days;
let paused = false;
let secondsPassedFocusing = 0;
let viewPosition = 300;
let currentView = 1;

document.addEventListener("DOMContentLoaded", setupAllViews);
chrome.storage.onChanged.addListener(setupAllViews);
focusBtn.addEventListener("click", (() => sendMessage("started session")), false);
endBtn.addEventListener("click", endSession, false);
pauseBtn.addEventListener("click", pauseSession, false);
rightBtn.addEventListener("click", shiftRight, false);
leftBtn.addEventListener("click", shiftLeft, false);

function setupAllViews() {
    setupTimerViewPage();
    setupHourlyViewPage();
    setupWeeklyViewPage();
}

function setupHourlyViewPage() {
    clearOldSessionsFromHourlyView();
    setHourlyDisplayValues();
}

function setupWeeklyViewPage() {
    clearOldWeeklyData();
    setWeeklyMins();
    setWeeklyDisplayValues();
}

function setWeeklyDisplayValues() {
    chrome.storage.sync.get(['sunday','monday','tuesday','wednesday','thursday','friday','saturday','week'],
    function (data) {
        days = [data.sunday, data.monday, data.tuesday, data.wednesday, data.thursday, data.friday, data.saturday];
        weekOfTheYear = data.week;
        let max = findMaxDailyFocusTime(days);
        if (max === 0) {
            return;
        } else {
            setWeekNumberForDisplay();
            setFillValuesForWeeklyChart(max);
        }
    });
}

function setFillValuesForWeeklyChart(max) {
    for (let i = 0; i < days.length; i++) {
        let fill = days[i]/max * 100;
        let hour = Math.floor(days[i]/ 60);
        let minutes = days[i] - (hour * 60);
        totalTimes[i].innerHTML = hour + "H " + minutes + "M";
        weekdays[i].style.width = `${fill}%`;
    }
}
function setWeekNumberForDisplay() {
    week.innerHTML = "Week: " + weekOfTheYear;
}

function findMaxDailyFocusTime(days) {
    let max = 0;
    for (let i = 0; i < days.length; i++) {
        if (days[i] > max) {
            max = days[i];
        }
    }
    return max;
}

function setWeeklyDataToZero() {
    chrome.storage.sync.set({
        "sunday": 0,
        "monday": 0,
        "tuesday": 0,
        "wednesday": 0,
        "thursday": 0,
        "friday": 0,
        "saturday": 0
    });
}

function clearOldSessionsFromHourlyView() {
    chrome.storage.sync.get(['sessionsCompletedToday'], function (data) {
        sessionHistory = data.sessionsCompletedToday;
        if (sessionHistory.length > 0) {
            session = sessionHistory[0];
            let sessionStartTime = new Date(session.startTime).getDate();
            let today = new Date().getDate();
            if (sessionStartTime != today) {
                sessionHistory = [];
                chrome.storage.sync.set({"sessionsCompletedToday": sessionHistory});
            }
        }
    });
}

function setHourlyDisplayValues() {
    chrome.storage.sync.get(['sessionsCompletedToday', 'week'], function (data) {
        sessionsToday = data.sessionsCompletedToday;
        if (sessionsToday.length > 0) {
            setDateInDisplay(sessionsToday[0]);
        }
        addSessionsToHourlyView(sessionsToday);
    });
}

function addSessionsToHourlyView(sessionsToday) {
    for (let i = 0;  i < sessionsToday.length; i++) {
        session = sessionsToday[i];
        sessionStartTime = new Date(session.startTime);
        let focusMinutes = getSessionFocusMins(session);
        let topValue = sessionStartTime.getMinutes();
        let sessionDiv = document.createElement("div");
        sessionDiv.classList.add("session");
        sessionDiv.style.top = `${topValue}px`;
        sessionDiv.style.height = `${focusMinutes}px`;
        hours[sessionStartTime.getHours()].appendChild(sessionDiv);
    }
}

function clearOldWeeklyData() {
    chrome.storage.sync.get(['sessionsCompletedToday', 'week'], function (data) {
    let sessions = data.sessionsCompletedToday;
        if (sessions.length > 0) {
            let sessionWeekNumber = getSessionWeekNumber(sessions[0]);
            if (sessionWeekNumber != data.week) {
                setWeeklyDataToZero();
                chrome.storage.sync.set({"week": sessionWeekNumber});
            }
        }
    });
}

function getSessionWeekNumber(session) {
    let sessionDate = new Date(session.startTime);
    let startDate = new Date(sessionDate.getFullYear(), 0, 1);
    let days = Math.floor((sessionDate - startDate) / (24 * 60 * 60 * 1000));
    let weekNumber = Math.ceil(days / 7);
    return weekNumber;
}

function setDateInDisplay(session) {
    let time = (new Date(session.startTime)).toString();
    let year = (new Date(session.startTime)).getFullYear();
    let dateStr = time.split(year);
    date.innerHTML = dateStr[0] + year;
}

function setWeeklyMins() {
    chrome.storage.sync.get(['sessionsCompletedToday'], function (data) {
        let sessionsToday = data.sessionsCompletedToday;
        if (sessionsToday.length > 0) {
            let session = sessionsToday[0];
            let sessionDay = (new Date(session.startTime)).getDay();
            let totalMinsToday = getMinutesFocusedToday(sessionsToday);
            switch (sessionDay) {
                case 0:
                    chrome.storage.sync.set({'sunday': totalMinsToday});
                    break;
                case 1:
                    chrome.storage.sync.set({'monday': totalMinsToday});
                    break;
                case 2:
                    chrome.storage.sync.set({'tuesday': totalMinsToday});
                    break;
                case 3:
                    chrome.storage.sync.set({'wednesday': totalMinsToday});
                    break;
                case 4:
                    chrome.storage.sync.set({'thursday': totalMinsToday});
                    break;
                case 5:
                    chrome.storage.sync.set({'friday': totalMinsToday});
                    break;
                case 6:
                    chrome.storage.sync.set({'saturday': totalMinsToday});
            }
        }
    });
}

function getMinutesFocusedToday(sessionsToday) {
    let totalMins = 0;
    for (let i = 0; i < sessionsToday.length; i++) {
        totalMins += getSessionFocusMins(sessionsToday[i]);
    }
    return totalMins;
}

function getSessionFocusMins(session) {
    let startTime = (new Date(session.startTime)).getTime();
    let endTime = (new Date(session.endTime)).getTime();
    return Math.floor(((endTime - startTime) / 1000) / 60);
}

function endSession() {
    saveSessionToHistory();
    sendMessage("end session");
}

function pauseSession() {
    sendMessage("pause session");
    updateStorageToPause();
}

function saveSessionToHistory() {
    currentSession.endTime = (new Date()).getTime();
    currentSession.isPaused = false;
    currentSession.isFocusing = false;
    chrome.storage.sync.get(['sessionsCompletedToday'], function (data) {
        sessionsToday = data.sessionsCompletedToday;
        sessionsToday.push(currentSession);
        chrome.storage.sync.set({"sessionsCompletedToday": sessionsToday});
    });
}

function updateStorageToPause() {
    currentSession.isFocusing = true;
    currentSession.isPaused = true;
    currentSession.secsFocused = secondsPassedFocusing;
    chrome.storage.sync.set({"currentSession": currentSession});
}

function sendMessage(msg) {
    chrome.tabs.query({url: "https://*/*"}, function(tabs) {
        tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, msg);
        chrome.runtime.sendMessage(msg);
        });
    });
}

function setupTimerViewPage() {
    chrome.storage.sync.get(['currentSession'],
    function (data) {
        currentSession = data.currentSession;
        setSessionProperties();
        enableEndBtnIfFocusing();
        if (currentlyFocusing()) {
            displayForFocus();
        } else if (abandoningSession()){
            displayForEndingEarly();
        } else if (currentlyPaused()) {
            displayForPause();
        } else {
            defaultDisplay();
        }
    });
}

function setSessionProperties() {
    focusing = currentSession.isFocusing;
    sessionDuration = currentSession.sessionDuration * 60;
    startTime = currentSession.startTime;
    endTime = currentSession.endTime;
    paused = currentSession.isPaused;
    secondsPassedFocusing = currentSession.secsFocused;

}
function enableEndBtnIfFocusing() {
    if (focusing === true) {
        endBtn.disabled = false;
    } else {
        endBtn.disabled = true;
    }
}

function currentlyFocusing() {
    return focusing === true && paused === false;
}

function abandoningSession() {
    return focusing === false && timerDisplay !== undefined;
}

function currentlyPaused() {
    return focusing === true && paused === true;
}

function displayForFocus() {
    clearInterval(timerDisplay);
    displayPauseBtn();
    updateTime();
}

function displayForEndingEarly() {
    clearInterval(timerDisplay);
    defaultDisplay();
}

function displayForPause() {
    clearInterval(timerDisplay);
    displayRemainingTime();
}

function updateTime() {
    timerDisplay = setInterval(function () {
        secsRemaining = Math.round((endTime - (new Date()).getTime()) / 1000);
        secondsPassedFocusing = sessionDuration - secsRemaining;
        progressValue = secondsPassedFocusing / sessionDuration * 100;
        displayMins = Math.floor(secsRemaining / 60);
        displaySecs = secsRemaining % 60;
        if (secsRemaining > 0) {
            padValuesForDisplay(displayMins, displaySecs);
            timer.innerHTML = displayMins + ":" + displaySecs;
            progressBar.style.background = `conic-gradient(
                #4d5bf9 ${progressValue * 3.6}deg,
                #cadcff ${progressValue * 3.6}deg
            )`;
        } else {
            clearInterval(timerDisplay);
            timer.innerHTML = "00:00";
            progressBar.style.background = `conic-gradient(
                 #4d5bf9 ${360}deg,
                 #cadcff ${360}deg
            )`;
            defaultDisplay();
            endSession();
        }
    }, 1000);
}

function padValuesForDisplay(mins, secs) {
    if (mins <= 9) {
        displayMins = displayMins.toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
        });
    }
    if (secs <= 9) {
        displaySecs = displaySecs.toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
        });
    }
}

function displayRemainingTime() {
    displayMins = Math.floor((sessionDuration - secondsPassedFocusing) / 60);
    displaySecs = (sessionDuration - secondsPassedFocusing) % 60;
    padValuesForDisplay(displayMins, displaySecs);
    progressValue = secondsPassedFocusing / sessionDuration * 100;
    timer.innerHTML = displayMins + ":" + displaySecs;
    progressBar.style.background = `conic-gradient(
        #4d5bf9 ${progressValue * 3.6}deg,
        #cadcff ${progressValue * 3.6}deg
    )`;
    displayFocusBtn();
}

function defaultDisplay() {
    sessionDuration = sessionDuration / 60;
    timer.innerHTML = sessionDuration + ":00";
    progressBar.style.background = `conic-gradient(
            #4d5bf9 ${0}deg,
            #cadcff ${0}deg
    )`;
    displayFocusBtn();
}

function displayFocusBtn() {
    pauseBtn.style.display = `none`;
    focusBtn.style.display = `inline`;
}

function displayPauseBtn() {
    pauseBtn.style.display = `inline`;
    focusBtn.style.display = `none`;
}

function shiftRight() {
    if (currentView < 2) {
        viewPosition += views[0].offsetWidth;
        viewsContainer.style.transform = `translateX(-${viewPosition}px`;
        currentView++;
        updateDots();
    }
    if (currentView === 2) {
  	    rightBtn.disabled = true;
        rightArrow.style.visibility = `hidden`;
    }
    if (currentView > 0) {
        leftBtn.disabled = false;
        leftArrow.style.visibility = `visible`;
    }
}

function shiftLeft() {
    if (currentView > 0) {
        viewPosition -= views[0].offsetWidth;
        viewsContainer.style.transform = `translateX(-${viewPosition}px)`;
        currentView--;
        updateDots();
    }
    if (currentView === 0) {
  	    leftBtn.disabled = true;
        leftArrow.style.visibility = `hidden`;
    }
    if (currentView < 2) {
        rightBtn.disabled = false;
        rightArrow.style.visibility = `visible`;
    }
}

function updateDots() {
    dots.forEach((dot) => {
    	dot.classList.remove("active");
    });
    dots[currentView].classList.add("active");
}















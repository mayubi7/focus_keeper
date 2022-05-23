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
let progressBar = document.querySelector(".main-circle");

let timerDisplay;
let focusing;
let paused = false;
let sessionDuration;
let startTime;
let endTime;
let displayMins;
let displaySecs;
let progressValue;
let secondsPassedFocusing = 0;
let viewPosition = 300;
let currentView = 1;
let minsFocused = 0;
let currentSession;

document.addEventListener("DOMContentLoaded", function() {
    updateTimerDisplay();
});

focusBtn.addEventListener("click", sendStartMessage, false);
endBtn.addEventListener("click", endSession, false);
pauseBtn.addEventListener("click", pauseSession, false);
rightBtn.addEventListener("click", shiftRight, false);
leftBtn.addEventListener("click", shiftLeft, false);

chrome.storage.onChanged.addListener(updateTimerDisplay);

function sendStartMessage() {
    chrome.tabs.query({url: "https://*/*"}, function(tabs) {
        tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, "started session");
        chrome.runtime.sendMessage("started session");
    });
});
}

function endSession() {
    addSessionToHourlyView();
    saveSessionToStorage();
    sendEndMessage();
}

//TODO: Refactor
function addSessionToHourlyView() {
    chrome.storage.sync.get(['currentSession'], function (data) {
        currentSession = data.currentSession;
        startTime = new Date(currentSession.startTime);
        endTime = new Date(currentSession.endTime);
        currentTime = new Date();
        if (endTime.getTime() > currentTime.getTime()) {
            endTime = currentTime;
        }
        getSessionFocusMins();
        console.log("Started Session at : " + startTime);
        console.log("Ended Session at: " + endTime);
        console.log("Focus Minutes: " + minsFocused);
        let defaultTop = -20 + startTime.getMinutes();

        let sessionDiv = document.createElement("div");
        sessionDiv.classList.add("session");
        sessionDiv.style.top = `${defaultTop}px`;
        sessionDiv.style.height = `${minsFocused}px`;
        hours[startTime.getHours()].appendChild(sessionDiv);
        });
}

function getSessionFocusMins() {
    minsFocused = Math.floor(((endTime.getTime() - startTime.getTime()) / 1000) / 60);
}
//TODO: update this function
function saveSessionToStorage() {
    chrome.storage.sync.get(['sessionsCompletedToday'], function (data) {
        sessionsToday = data.sessionsCompletedToday;
        sessionsToday.push(currentSession);
    })
}

function sendEndMessage() {
    chrome.tabs.query({url: "https://*/*"}, function(tabs) {
        tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, "end session");
        chrome.runtime.sendMessage("end session");
    });
});
}

function pauseSession() {
    sendPauseMessage();
    updateStorageToPause();
}

function sendPauseMessage() {
    chrome.tabs.query({url: "https://*/*"}, function(tabs) {
        tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, "pause session");
        chrome.runtime.sendMessage("pause session");
    });
});
}

function updateStorageToPause() {
    currentSession.isFocusing = true;
    currentSession.isPaused = true;
    currentSession.secsFocused = secondsPassedFocusing;
    console.log("Seconds Passed Focusing before PAUSE:" + secondsPassedFocusing);
    chrome.storage.sync.set({"currentSession": currentSession});
}

function updateTimerDisplay() {
    chrome.storage.sync.get(['currentSession'],
    function (data) {
        currentSession = data.currentSession;
        setSessionProperties();
        if (currentlyFocusing()) {
            displayForFocus();
        } else if (abandoningSession()){
            displayForEndingEarly();
        } else if (currentlyPaused()) {
            console.log("----> CURRENTLY PAUSING SESSION");
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
    console.log("Clearing before starting another: " + timerDisplay);
    clearInterval(timerDisplay);
    displayPauseBtn();
    updateTime();
}

function displayForEndingEarly() {
    clearInterval(timerDisplay);
    defaultDisplay();
}

function displayForPause() {
    console.log("CLEARING TIMER:" + timerDisplay);
    clearInterval(timerDisplay);
    displayRemainingTime();
}

function updateTime() {
    console.log("Timer Display Value: " + timerDisplay);
    timerDisplay = setInterval(function () {
        console.log(timerDisplay);
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















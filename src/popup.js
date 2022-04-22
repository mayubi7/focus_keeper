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

document.addEventListener("DOMContentLoaded", function() {
    updateTimerDisplay();
});

focusBtn.addEventListener("click", sendStartMessage, false);
endBtn.addEventListener("click", sendEndMessage, false);
pauseBtn.addEventListener("click", sendPauseMessage, false);
rightBtn.addEventListener("click", shiftRight, false);
leftBtn.addEventListener("click", shiftLeft, false);

chrome.storage.onChanged.addListener(updateTimerDisplay);

function sendStartMessage() {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "started session"));
        chrome.runtime.sendMessage("started session");
    });
    displayPauseBtn();
}

function sendEndMessage() {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "end session"));
        chrome.runtime.sendMessage("end session");
    });
    displayFocusBtn();
}

function sendPauseMessage() {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "pause session"));
        chrome.runtime.sendMessage("pause session");
    });
    paused = true;
    displayFocusBtn();
    chrome.storage.sync.set({
        isPaused: true,
        secsFocused: secondsPassedFocusing,
    });
    chrome.runtime.sendMessage("SecondPassed Setting:" + secondsPassedFocusing);
}
function updateTimerDisplay() {
    chrome.storage.sync.get(['isFocusing', 'sessionDuration', 'startTime', 'isPaused', 'secsFocused','endTime'],
    function (session) {
        focusing = session.isFocusing;
        sessionDuration = session.sessionDuration * 60;
        startTime = session.startTime;
        endTime = session.endTime;
        paused = session.isPaused;
        secondsPassedFocusing = session.secsFocused;
        if (focusing && !paused) {
            chrome.runtime.sendMessage("focusing");
            displayPauseBtn();
            updateTime();
        } else if (!focusing && timerDisplay !== undefined){
            clearInterval(timerDisplay);
            defaultDisplay();
        } else if (focusing && paused) {
            clearInterval(timerDisplay);
            displayRemainingTime();
        } else {
            defaultDisplay();
        }
    });
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
            sendEndMessage();
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















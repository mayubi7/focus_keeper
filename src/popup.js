const focusBtn = document.querySelector("#focus");
const endBtn = document.querySelector("#end");
const timer = document.querySelector(".timer");
const rightBtn = document.querySelector(".navigation-btns .right-btn");
const leftBtn = document.querySelector(".navigation-btns .left-btn");
const views = document.querySelectorAll(".card-view .view");
const viewsContainer = document.querySelector(".card-view .views");
const dots = document.querySelectorAll(".card-view .dot");
const rightArrow = document.querySelector(".right .right-arrow");
const leftArrow = document.querySelector(".left .left-arrow");

var timerDisplay;
var focusing;
var sessionDuration;
var startTime;
var displayMins;
var displaySecs;
var progressValue;
var secondsPassedFocusing = 0;

let viewPosition = 300;
let currentView = 1;
let progressBar = document.querySelector(".main-circle");

document.addEventListener("DOMContentLoaded", function() {
    updateTimerDisplay();
});

focusBtn.addEventListener("click", sendStartMessage, false);
endBtn.addEventListener("click", sendEndMessage, false);
rightBtn.addEventListener("click", shiftRight, false);
leftBtn.addEventListener("click", shiftLeft, false);

chrome.storage.onChanged.addListener(updateTimerDisplay);

function sendStartMessage () {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "started session"));
        chrome.runtime.sendMessage("started session");
    });
    focusBtn.disabled = true;
}

function sendEndMessage () {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "end session"));
        chrome.runtime.sendMessage("end session");
    });
    focusBtn.disabled = false;
}

function updateTimerDisplay() {
    chrome.storage.sync.get(['isFocusing', 'sessionDuration', 'startTime'], function (session) {
        focusing = session.isFocusing;
        sessionDuration = session.sessionDuration * 60;
        startTime = session.startTime;
        if (focusing) {
            focusBtn.disabled = true;
            chrome.runtime.sendMessage("focusing");
            timerDisplay = setInterval(function () {
                secondsPassedFocusing = Math.round(((new Date).getTime() - startTime) / 1000);
                progressValue = secondsPassedFocusing / sessionDuration * 100;
                displayMins = Math.floor((sessionDuration - secondsPassedFocusing) / 60);
                displaySecs = (sessionDuration - secondsPassedFocusing) % 60;
                if (sessionDuration - secondsPassedFocusing >= 0) {
                    padValuesForDisplay(displayMins, displaySecs);
                    timer.innerHTML = displayMins + ":" + displaySecs;
                    console.log(progressValue);
                    progressBar.style.background = `conic-gradient(
                        #4d5bf9 ${progressValue * 3.6}deg,
                        #cadcff ${progressValue * 3.6}deg
                        )`;
                    } else {
                        clearInterval(timerDisplay);
                    }
            }, 1000);
        } else if (focusing === false && timerDisplay !== undefined){
            clearInterval(timerDisplay);
            chrome.runtime.sendMessage("Timer cleared");
            sessionDuration = sessionDuration / 60;
            timer.innerHTML = sessionDuration + ":00";
            focusBtn.disabled = false;
        } else {
            sessionDuration = sessionDuration / 60;
            timer.innerHTML = sessionDuration + ":00";
        }
    });
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















var timerDisplay;
var focusing;
var sessionDuration;
var startTime;
var secondsPassedFocusing = 0;
var displayMins;
var displaySecs;
var progressValue;

let progressBar = document.querySelector(".main-circle");

document.addEventListener("DOMContentLoaded", function() {
    updateTimerDisplay();
});

document.addEventListener("DOMContentLoaded", function() {
    document.querySelector("#focus").addEventListener("click", sendStartMessage, false)}, false);

document.querySelector("#end").addEventListener("click", sendEndMessage, false);

function sendStartMessage () {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "started session"));
        chrome.runtime.sendMessage("started session");
    });
    document.querySelector("#focus").disabled = true;
}

function sendEndMessage () {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "end session"));
        chrome.runtime.sendMessage("end session");
    });
    document.querySelector("#focus").disabled = false;
}

chrome.storage.onChanged.addListener(updateTimerDisplay);

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

function updateTimerDisplay() {
    chrome.storage.sync.get(['isFocusing', 'sessionDuration', 'startTime'], function (session) {
        focusing = session.isFocusing;
        sessionDuration = session.sessionDuration * 60;
        startTime = session.startTime;
        if (focusing) {
            document.querySelector('#focus').disabled = true;
            timerDisplay = setInterval(function () {
                secondsPassedFocusing = Math.round(((new Date).getTime() - startTime) / 1000);
                progressValue = secondsPassedFocusing / sessionDuration * 100;
                displayMins = Math.floor((sessionDuration - secondsPassedFocusing) / 60);
                displaySecs = (sessionDuration - secondsPassedFocusing) % 60;
                if (sessionDuration - secondsPassedFocusing >= 0) {
                    padValuesForDisplay(displayMins, displaySecs);
                    document.querySelector('.timer').innerHTML = displayMins + ":" + displaySecs;
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
            document.querySelector(".timer").innerHTML = sessionDuration + ":00";
            document.querySelector("#focus").disabled = false;
        } else {
            sessionDuration = sessionDuration / 60;
            document.querySelector(".timer").innerHTML = sessionDuration + ":00";
        }
    });
}

const rightBtn = document.querySelector(".navigation-btns .right-btn");
const leftBtn = document.querySelector(".navigation-btns .left-btn");
const views = document.querySelectorAll(".card-view .view");
const viewsContainer = document.querySelector(".card-view .views");
const dots = document.querySelectorAll(".card-view .dot");
const rightArrow = document.querySelector(".right .right-arrow");
const leftArrow = document.querySelector(".left .left-arrow");

let viewPosition = 300;
let currentView = 1;

rightBtn.addEventListener("click", () => {
  if (currentView < 2) {
    viewPosition += views[0].offsetWidth;
    viewsContainer.style.transform = `translateX(-${viewPosition}px`;
    currentView++;

    dots.forEach((dot) =>{
    	dot.classList.remove("active");
    });

    dots[currentView].classList.add("active");
  }

  if (currentView === 2) {
  	rightBtn.disabled = true;
    rightArrow.style.visibility = `hidden`;
  }

  if (currentView > 0) {
    leftBtn.disabled = false;
    leftArrow.style.visibility = `visible`;
  }
});

leftBtn.addEventListener("click", () => {
 if (currentView > 0) {
    viewPosition -= views[0].offsetWidth;
    viewsContainer.style.transform = `translateX(-${viewPosition}px)`;
    currentView--;

    dots.forEach((dot) =>{
    	dot.classList.remove("active");
    });

    dots[currentView].classList.add("active");
  }

  if (currentView === 0) {
  	leftBtn.disabled = true;
    leftArrow.style.visibility = `hidden`;
  }

  if (currentView < 2) {
    rightBtn.disabled = false;
    rightArrow.style.visibility = `visible`;
  }
});














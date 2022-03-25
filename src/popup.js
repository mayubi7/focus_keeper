var timerDisplay;
var focusing;
var sessionDuration;
var startTime;
var secondsPassedFocusing = 0;
var displayMins;
var displaySecs;
var progressValue;

let progressBar = document.querySelector("#outer-circle");

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
                    document.querySelector('#timer').innerHTML = displayMins + ":" + displaySecs;
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
            document.querySelector("#timer").innerHTML = sessionDuration + ":00";
            document.querySelector("#focus").disabled = false;
        } else {
            sessionDuration = sessionDuration / 60;
            document.querySelector("#timer").innerHTML = sessionDuration + ":00";
        }
    });
}












document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#focus').addEventListener("click", sendStartMessage, false)}, false);

document.querySelector('#end').addEventListener("click", sendEndMessage, false);

function sendStartMessage () {
    chrome.tabs.query({}, function (tabs) {
    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "started session"));
    chrome.runtime.sendMessage("started session");
    });}

function sendEndMessage () {
    chrome.tabs.query({}, function (tabs) {
    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "end session"));
    chrome.runtime.sendMessage("end session");
    });}







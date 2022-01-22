
// document here refers to popup.html file
// adding event listener to the document waits for popup.html stuff to load
//
document.addEventListener('DOMContentLoaded', function () {
// then in that document we will find the button and when it is clicked we will call function onclick
document.getElementById('start').onclick = sendStartMessage();}, false);

function sendStartMessage () {
// here interact with content script to achieve above
// all this is code from tutorial to figure out how it would work: sends out hi message
//only on social media sites, on other pages clicking button does nothing
    chrome.tabs.query({},
    function (tabs) {
    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "started session"));});
    chrome.runtime.sendMessage("started session");
    };

document.addEventListener('DOMContentLoaded', function () {
document.getElementById('end').onclick = function () {
    chrome.tabs.query({},
    function (tabs) {
    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, "end session"));});
    chrome.runtime.sendMessage("end session");}}, false);





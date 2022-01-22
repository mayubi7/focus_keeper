//alert("You should be studying right now!")
// this function must be in content.js cuz popup.js cannot change content of webpage doesn't have access
var current = window.location.href;

chrome.runtime.onMessage.addListener(function (text) {
    if (text === "end session") {
        window.location.reload(false);
    } else if(toBlock()) {
        document.documentElement.innerHTML = '';
        document.documentElement.innerHTML = 'Domain is blocked';
        document.documentElement.scrollTop = 0;}});

function toBlock() {
    return current.includes("www.facebook.com") || current.includes("mail.google.com") ||
    current.includes("www.instagram.com") || current.includes("youtube.com") || current.includes("www.pinterest.com");}
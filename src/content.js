var current = window.location.href;

chrome.runtime.onMessage.addListener(function (request) {
    if (request === "end session") {
        window.location.reload(false);
    } else if (request === "focus completed") {
        window.location.reload(false);
    } else if (toBlock()) {
        document.documentElement.innerHTML = '';
        document.documentElement.innerHTML = 'Domain is blocked';
        document.documentElement.scrollTop = 0;
    }
});

function toBlock() {
    return current.includes("www.facebook.com") ||
    current.includes("mail.google.com") ||
    current.includes("www.instagram.com") ||
    current.includes("youtube.com") ||
    current.includes("www.pinterest.com");
}




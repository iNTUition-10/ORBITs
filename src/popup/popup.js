console.log("popup.js loaded")
document.getElementById('add').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "GET_FORM0"}, function(response) {
            console.log("popup.js received response")
            console.log(response.data)
        })
    })
})
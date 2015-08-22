// Open main.html on icon click
chrome.browserAction.onClicked.addListener( function() {
    chrome.tabs.create({'url': chrome.extension.getURL('main.html')}, function(tab) {
    });
});

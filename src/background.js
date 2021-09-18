// Open main.html on icon click
chrome.action.onClicked.addListener((_tab) => {
    chrome.tabs.create({
        url: 'main.html',
    });
});

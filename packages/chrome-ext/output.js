const {events, data} = chrome.extension.getBackgroundPage().getData();
console.log(events);
console.log(data);

import Extractors from '@genxtract/extract';

const extractors = new Extractors();
const outputURL = chrome.extension.getURL('output.html');

let dataTab = null;
let data = {};

window.getData = function() {
  return data;
};

function updateIcon(url) {
  const {id} = extractors.match({url});
  if (id) {
    chrome.browserAction.setIcon({path: 'icons/active.svg'});
  } else {
    chrome.browserAction.setIcon({path: 'icons/inactive.svg'});
  }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    updateIcon(tab.url);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active) {
    updateIcon(tab.url);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  data = message;
  if (dataTab === null) {
    chrome.tabs.create({url: outputURL}, (tab) => {
      dataTab = tab.id;
    });
  } else {
    chrome.tabs.update(dataTab, {url: outputURL, active: true});
  }
});

// Listen for our browerAction to be clicked
chrome.browserAction.onClicked.addListener((tab) => {
  // Get matching extractors
  const {id, path} = extractors.match({url: tab.url});

  if (id) {
    // Inject combinator
    chrome.tabs.executeScript(tab.id, {
      file: 'combinator.js',
    });

    // Inject extractor
    chrome.tabs.executeScript(tab.id, {
      file: path,
    });
  }
});

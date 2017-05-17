import Extractors from '@genxtract/extract';

const extractors = new Extractors();

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

chrome.runtime.onMessage.addListener(({events, data}) => {
  console.log(events, data);
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

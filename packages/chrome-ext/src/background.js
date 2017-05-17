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

// Listen for our browerAction to be clicked
chrome.browserAction.onClicked.addListener((tab) => {
  // Get matching extractors
  const {id, path} = extractors.match({url: tab.url});

  if (id) {
    // Inject event pipe
    chrome.tabs.executeScript(tab.id, {
      file: 'events-to-console.js',
    });

    // Inject extractor
    console.log(`injecting ${id}, ${path}`);
    chrome.tabs.executeScript(tab.id, {
      file: path,
    });
  }
});

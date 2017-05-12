import Extractors from '@genxtract/extract';

const extractors = new Extractors();

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

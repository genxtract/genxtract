import Extractors from '@genxtract/extract';

const extractors = new Extractors();

// Listen for our browerAction to be clicked
chrome.browserAction.onClicked.addListener((tab) => {
  // Get matching extractors
  const matchingExtractors = extractors.match({url: tab.url});
  if (matchingExtractors.length > 0) {

    // Inject event pipe
    chrome.tabs.executeScript(tab.ib, {
      file: 'events-to-console.js'
    });

    // Inject matching extractors
    for (const extractor of matchingExtractors) {
      console.log(`injecting ${extractor.id}, ${extractor.path}`);
      chrome.tabs.executeScript(tab.ib, {
        file: extractor.path,
      });
    }
  }
});

(function () {
'use strict';

class Genxtract {
  constructor() {

  }

  match({url}) {
    return [
      {id: 'inject', path: 'node_modules/@genxtract/extract/inject.js'},
    ];
  }
}

const genxtract = new Genxtract();

// Listen for our browerAction to be clicked
chrome.browserAction.onClicked.addListener((tab) => {

  // Inject event pipe
  chrome.tabs.executeScript(tab.ib, {
    file: 'event-pipe.js'
  });

  // Get matching extractors
  const extractors = genxtract.match('bogus');
console.log('extractors', extractors);
  for (const extractor of extractors) {
    chrome.tabs.executeScript(tab.ib, {
  		file: extractor.path,
  	});
  }
});

}());

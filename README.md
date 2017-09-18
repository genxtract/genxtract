# genxtract

Extracting genealogical data from various websites. Designed to be used in browser extensions.

This repository contains multiple packages:

* [chrome-ext](packages/chrome-ext) - A Chrome extension used in development for running tests
* [combinator](packages/combinator) - Base class for combinator implmentations
* [extract](packages/extract) - Contains the extractors and code they depend on
* [gedcomx](packages/extract) - A combinator for GEDCOM X

## Available Extractors

| Website | Tree | Records |
|---------|:----:|:-------:|
|[Ancestry.com](https://www.ancestry.com)|X||
|[BillionGraves](http://billiongraves.com)||X|
|[FamilySearch.org](https://familysearch.org)|X|X|
|[Find A Grave](http://www.findagrave.com)||X|
|[findmypast](http://www.findmypast.com)|X|X|
|[Genealogie Online](https://www.genealogieonline.nl)|X||
|[MyHeritage](https://www.myheritage.com)|X|X|
|[Open Archives](https://www.openarch.nl)||X|
|[WeRelate](http://www.werelate.org)|X||
|[WikiTree](https://www.wikitree.com)|X||

## Usage

1. Inject a combinator into the page and call `combinator.start()`, keeping a reference to the promise that is returned.
2. Use `Extractors.match()` to get the path of the extractor for that page.
3. Inject the extractor.
4. Wait for the promise from `combinator.start()` to be resolved.

Here are snippets from the `chrome-ext` developer test extension that show how this can be done:

```js
// In a background script...

// Listen for our browerAction to be clicked
chrome.browserAction.onClicked.addListener((tab) => {

  // Get a matching extractor
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
```

```js
// combinator.js
const combinator = new GedcomX();
combinator.start()
  .then((data) => {
    // Send the data to the background script
    chrome.runtime.sendMessage(data);
  })
  .catch((error) => console.error(error));
```

Notes:

* We inject and start the combinator first so that it is ready to listen for events from the extractor.
  The extractor will likely start firing events as soon as it's injected.
* In the example above, `combinator.js` is a small file that wraps the combinator to initialize it
  and interface with the browser extension.

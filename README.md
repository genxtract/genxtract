# genxtract

Extracting genealogical data from various websites. Designed to be used in browser extensions.

## Extractors

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

## Install

````bash
npm install && npm run bootstrap
````

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

## Developing extractors

1. cd to `packages/chrome-ext` and run `npm run build` to build the extension
1. install the chrome extension in `packages/chrome-ext` as an [unpacked extension](https://developer.chrome.com/extensions/getstarted#unpacked)
1. cd to `packages/extract` and run `npm run watch`. 

You do not have to reload the chrome extension everytime an extractor is changed. You only have to reload when `Emit`, `Extraction`, 
or `Extractors` are changed. Note that source maps are included, so look carefully at the stack traces in errors to pick the original and not the bundled line number.

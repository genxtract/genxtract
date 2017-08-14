# genxtract

Extracting genealogical data from various websites.

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

## Developing extractors

1. cd to `packages/chrome-ext` and run `npm run build` to build the extension
1. install the chrome extension in `packages/chrome-ext` as an [unpacked extension](https://developer.chrome.com/extensions/getstarted#unpacked)
1. cd to `packages/extract` and run `npm run watch`. 

You do not have to reload the chrome extension everytime an extractor is changed. You only have to reload when `Emit`, `Extraction`, 
or `Extractors` are changed. Note that source maps are included, so look carefully at the stack traces in errors to pick the original and not the bundled line number.

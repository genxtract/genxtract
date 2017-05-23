# genxtract
Extracting genealogical data from various websites.

## Extractors

**Supported**

| Website | Tree | Records |
|---------|:----:|:-------:|
|[FamilySearch.org](https://familysearch.org)|X||
|[Find A Grave](http://www.findagrave.com)||X|
|[WeRelate](http://www.werelate.org)|X||

**Planned**

| Website | Tree | Records |
|---------|:----:|:-------:|
|[allefriezen.nl](https://www.allefriezen.nl)||X|
|[allegroningers.nl](http://allegroningers.nl)||X|
|[Ancestry.com](http://ancestry.com)|X|X|
|[Archives.com](https://www.archives.com)||X|
|[Australian Cemeteries Index](http://austcemindex.com)||X|
|[BillionGraves](http://billiongraves.com)||X|
|[Digitalarkivet](https://www.arkivverket.no/eng/Digitalarkivet)||X|
|[FamilySearch.org](https://familysearch.org)||X|
|[findmypast.com](http://www.findmypast.com)|X|X|
|[findmypast.co.uk](http://www.findmypast.co.uk)|X|X|
|[findmypast.com.au](http://www.findmypast.com.au)|X|X|
|[findmypast.ie](http://www.findmypast.ie)|X|X|
|[Fold3](https://www.fold3.com)||X|
|[Genealogie Online](https://www.genealogieonline.nl)|X||
|[GenealogyBank](http://www.genealogybank.com)||X|
|[Geneanet](http://www.geneanet.org)|X|X|
|[MyHeritage](https://www.myheritage.com)|X|X|
|[Newspapers.com](https://www.newspapers.com)||X|
|[Open Archives](https://www.openarch.nl)||X|
|[wiewaswie.nl](https://www.wiewaswie.nl/en/)||X|
|[WikiTree](http://www.wikitree.com)|X||

## Install
````bash
npm install && npm run bootstrap
````

## Developing extractors
To develop extractors install the chrome extension in `packages/chrome-ext`, cd to `packages/extract` and run `npm run watch`. You do not have to reload the chrome extension on changes. The extension will always inject files pulled from `packages/extract/dist`. Note that source maps are included, so look carefully at the stack traces in errors to pick the original and not the bundled line number.

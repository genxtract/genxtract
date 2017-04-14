# genxtract
Extracting genealogical data from various websites.

## Install
````bash
npm install && npm run bootstrap
````

## Developing extractors
To develop extractors install the chrome extension in `packages/chrome-ext`, cd to `packages/extract` and run `npm run watch`. You do not have to reload the chrome extension on changes. The extension will always inject files pulled from `packages/extract/dist`. Note that source maps are included, so look carefully at the stack traces in errors to pick the original and not the bundled line number.

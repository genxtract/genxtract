# extract

* `Extraction` sets up and manages the state of an extraction and caontains helpers methods for emitting data.
* `Extractors` manages available extractors and matches a URL against their registered regexes.

## Developing extractors

Setup the development environment:

1. `cd packages/chrome-ext` and run `npm run build` to build the extension
1. Install the chrome extension in `packages/chrome-ext` as an [unpacked extension](https://developer.chrome.com/extensions/getstarted#unpacked)
1. `cd packages/extract` and run `npm run watch`. 

Create an extractor:

1. Create a file for the extractor in `src/extractors`. 
    * For websites that have both a tree and records the convention is to name the parser 
    `${sitename}-person.js` for the tree and `${sitename}-record.js` for the records.
    * We recommend beginning a new extractor by copying an existing extractor, such 
    as `billiongraves`, to get the correct setup and layout.
1. Add the extractor to `Extractors.js`
1. Reload the chrome extension
1. Develop and test

You do not have to reload the chrome extension everytime an extractor is changed.
You only have to reload when `Emit`, `Extraction`, or `Extractors` are changed. 
Note that source maps are included, so look carefully at the stack traces in errors
to pick the original and not the bundled line number.

### Testing

Tests are run live via [puppetteer](https://github.com/GoogleChrome/puppeteer).
Output of the extracts can be recorded by running `npm run test:record`. The output
is saved and later copmared in subsequent test runs when recording is not enabled.

`GENXTRACT_USERNAME` and `GENXTRACT_PASSWORD` are required env vars for testing
extractors that require an authenticated session with the site.
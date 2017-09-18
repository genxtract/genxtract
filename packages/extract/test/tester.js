const joinPath = require('path').join;
const fs = require('fs');
const mkdirp = require('mkdirp');
const puppeteer = require('puppeteer');
const Extractors = require('../dist/Extractors');
const extractors = new Extractors({
  prefix: './',
});
const expect = require('chai').expect;
const debug = require('debug')('genxtract:setupTest');
const RECORD = !!process.env.RECORD;
const ACCESSED_DATE_OVERRIDE = 1483228800000; // 1 Jan 2017 00:00:00 UTC

/**
 * Create a test setup factory
 * 
 * @param {String} extractor Name of the extractor; used in directory structure of recordings
 * @return {Function} function(fileName, url)
 */
module.exports = function tester(extractor) {
  
  const outputPath = joinPath(__dirname, 'data', extractor);

  /**
   * Setup a mocha test.
   * 
   * @param {String} fileName Name of the file that the output will be saved to or compared to.
   * @param {Sting} url
   * @return {Function} function(done)
   */
  return function test(fileName, url) {
    debug(fileName, url);

    // Mocha test body
    return async function() {
      this.timeout(30000);

      debug('running test', fileName);

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);

      debug('page loaded');

      // Inject collector
      const collector = page.evaluate(() => {
        return new Promise((resolve, reject) => {
          const events = [];
          window.addEventListener('genxtract', (e) => {
            const event = e.detail;
            events.push(event);
            if(event.type === 'END') {
              resolve(events);
            }
          });
        });
      });

      debug('collector injected');

      // Inject extractor
      const {id, path} = extractors.match({url});
      debug('extractor match', id, path);
      await page.injectFile(path);
      debug('extractor injected');

      // Wait for output
      const events = await collector;
      debug('events received');
      
      // Force the accessed property of citations to be consistent for the sake of testing
      for(let event of events) {
        if(event.type === 'DATA' && event.data.type === 'Citation') {
          event.data.data.accessed = ACCESSED_DATE_OVERRIDE;
        }
      }

      // Record or compare
      const outputFile = joinPath(outputPath, `${fileName}.json`);
      if(RECORD) {
        mkdirp(outputPath);
        fs.writeFileSync(outputFile, JSON.stringify(events, null, 2));
      } else {
        const recording = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        expect(events).to.deep.equal(recording);
      }
    };
  };
};

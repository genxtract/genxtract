const joinPath = require('path').join;
const fs = require('fs');
const mkdirp = require('mkdirp');
const puppeteer = require('puppeteer');
const Extractors = require('../dist/Extractors');
const extractors = new Extractors({
  prefix: './',
});
const expect = require('chai').expect;
const debug = require('debug')('genxtract:tester');
const RECORD = !!process.env.RECORD;

class Tester {
  
  /**
   * @param {String} extractor Name of the extractor; used in directory structure of recordings
   */
  constructor(extractor) {
    this.extractorName = extractor;
    this.outputPath = joinPath(__dirname, 'data', extractor);
  }

  get username() {
    if(!process.env.GENXTRACT_USERNAME) {
      throw new Error('GENXTRACT_USERNAME env var is missing');
    }
    return process.env.GENXTRACT_USERNAME;
  }
  
  get password() {
    if(!process.env.GENXTRACT_PASSWORD) {
      throw new Error('GENXTRACT_PASSWORD env var is missing');
    }
    return process.env.GENXTRACT_PASSWORD;
  }

  get dateOverride() {
    return 1483228800000; // 1 Jan 2017 00:00:00 UTC
  }

  /**
   * New browser instance
   */
  async launchBrowser() {
    await this.cleanup();
    this.browser = await puppeteer.launch();
  }

  /**
   * Launch puppeteer and get a page
   * 
   * @param {Boolean} fresh If truthy, launch a new browser instance
   * @return {*} puppeteer page
   */
  async page(fresh) {
    if(!this.browser || fresh) {
      await this.launchBrowser();
    }
    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.91 Safari/537.36');
    page.on('console', (...args) => {
      debug(...args);
    });
    return page;
  }

  /**
   * Close the browser
   */
  async cleanup() {
    if(this.browser) {
      await this.browser.close();
    }
  }
  
  /**
   * Setup a mocha test.
   * 
   * @param {String} fileName Name of the file that the output will be saved to or compared to.
   * @param {Sting} url
   * @return {Function} function(done)
   */
  test(fileName, url) {

    debug('test', fileName, url);

    // In the mocha test body below we need `this` to have the context
    // setup by mocha so here we keep a reference to the tester instance
    const tester = this;

    // Mocha test body
    return async function() {
      this.timeout(30000);

      debug('running test', fileName);

      const page = await tester.page();
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
          event.data.data.accessed = tester.dateOverride;
        }
      }

      // Record or compare
      const outputFile = joinPath(tester.outputPath, `${fileName}.json`);
      if(RECORD) {
        mkdirp(tester.outputPath);
        fs.writeFileSync(outputFile, JSON.stringify(events, null, 2));
      } else {
        const recording = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        expect(events).to.deep.equal(recording);
      }
    };
  }
}

module.exports = function(extractor) {
  return new Tester(extractor);
};

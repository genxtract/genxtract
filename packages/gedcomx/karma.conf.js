const resolve = require('rollup-plugin-node-resolve');

module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    browsers: ['ChromeHeadless'],
    files: [
      'src/*.test.js',
    ],
    preprocessors: {
     'src/*.test.js': ['rollup'],
    },
    rollupPreprocessor: {
      // rollup settings. See Rollup documentation
      plugins: [
        resolve({}),
      ],
      // will help to prevent conflicts between different tests entries
      format: 'iife',
      sourceMap: 'inline',
    },
    reporters: ['mocha'],
    mochaReporter: {
      showDiff: true,
    },
  });
};

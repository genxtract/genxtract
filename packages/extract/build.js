const rollup = require('rollup');
const glob = require('glob');

// Build lib files
glob('src/*.js', {nodir: true}, (error, filenames) => {
  filenames.forEach((file) => {
    rollup.rollup({
      entry: file,
    }).then((bundle) => {
      bundle.write({
        format: 'cjs',
        dest: 'dist/' + file.split('/').pop(),
      });
    });
  });
});

// Build extractors
glob('src/extractors/*.js', {nodir: true}, (error, filenames) => {
  filenames.forEach((file) => {
    rollup.rollup({
      entry: file,
    }).then((bundle) => {
      bundle.write({
        format: 'iife',
        dest: 'dist/extractors/' + file.split('/').pop(),
        sourceMap: true,
      });
    });
  });
});

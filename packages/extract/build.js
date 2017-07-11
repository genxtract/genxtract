const rollup = require('rollup');
const glob = require('glob');

// Build lib files
// find ./src -maxdepth 1 -type f -exec basename {} \\; | xargs -I % rollup src/% -f cjs -o dist/%
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
// find ./src/extractors -maxdepth 1 -type f -exec basename {} \\; |
//   xargs -I % rollup src/extractors/% -f iife -o dist/extractors/% --sourcemap
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

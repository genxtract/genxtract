import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/background.js',
  dest: 'background.js',
  format: 'iife',
  plugins: [
    resolve({}),
  ]
};

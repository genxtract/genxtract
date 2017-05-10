import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/GedcomX.js',
  dest: 'dist/GedcomX.js',
  format: 'cjs',
  plugins: [
    resolve({}),
  ],
};

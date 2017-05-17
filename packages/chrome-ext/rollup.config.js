import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: `src/${process.env.entry}.js`,
  dest: `${process.env.entry}.js`,
  format: 'iife',
  plugins: [
    resolve({}),
  ],
};

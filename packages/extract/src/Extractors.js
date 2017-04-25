// NOTE: one extractor per url
const extractors = {
  'werelate-person': [/www.werelate.org\/wiki\/Person:/],
};

class Extractors {
  constructor({prefix} = {}) {
    this.prefix = prefix || 'node_modules/@genxtract/extract';
  }

  // Will return the first match we find
  match({url}) {
    const results = [];
    for (let extractor of Object.keys(extractors)) {
      for (const regex of extractors[extractor]) {
        if (regex.test(url)) {
          return {
            id: extractor,
            path: `${this.prefix}/dist/extractors/${extractor}.js`,
          };
        }
      }
    }
    return results;
  }
}

export default Extractors;

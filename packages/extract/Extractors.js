const extractors = {
  'werelate-person': [/www.werelate.org\/wiki\/Person:/],
};

class Extractors {
  constructor({prefix} = {}) {
    this.prefix = prefix || 'node_modules/@genxtract/extract';
  }

  match({url}) {
    const results = [];
    for (let extractor of Object.keys(extractors)) {
      for (const regex of extractors[extractor]) {
        if (regex.test(url)) {
          results.push({
            id: extractor,
            path: `${this.prefix}/dist/${extractor}.js`,
          });
        }
      }
    }
    return results;
  }
}

export default Extractors;

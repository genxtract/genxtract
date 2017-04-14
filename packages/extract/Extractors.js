const extractors = {
  'test': [/google\.com/],
};

class Extractors {
  constructor({prefix}) {
    this.prefix = prefix;
  }

  match({url}) {
    const results = [];
    for (let extractor in extractors) {
      for (const regex of extractors[extractor]) {
        console.log(regex, url)
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

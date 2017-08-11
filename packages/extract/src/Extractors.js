// NOTE: one extractor per url
const extractors = {
  'ancestry-person': [/www\.ancestry\.com\/family-tree\/person\/tree\/[^\/]+\/person\//],
  'ancestry-record': [/search\.ancestry\.com\/cgi-bin\/sse.dll/],
  'billiongraves': [/billiongraves\.com\/grave\//],
  'familysearch-person': [/familysearch\.org\/tree\/person\//],
  'familysearch-record': [/familysearch\.org\/pal:\/MM9\.1\.1\//, /familysearch\.org\/ark:\/61903\/1:1:/],
  'findagrave': [/www\.findagrave\.com\/cgi-bin\/fg\.cgi\?page=gr/],
  'findmypast-person': [/tree\.findmypast\.(co\.uk|com|ie|com\.au)/],
  'genealogieonline': [/www\.genealogieonline\.nl\/[a-z]+\/.+\/.+\.php/],
  'myheritage-person': [/www\.myheritage\.com\/person-/, /www\.myheritage\.com\/site-family-tree-/],
  'myheritage-record': [/www\.myheritage\.com\/research\/record-/],
  'openarchives': [/www\.openarch\.nl\/show\.php/],
  'werelate-person': [/www\.werelate\.org\/wiki\/Person:/],
  'wikitree-person': [/www\.wikitree\.com\/wiki\/.+-.+/],
};

class Extractors {
  constructor({prefix} = {}) {
    this.prefix = prefix || 'node_modules/@genxtract/extract';
  }

  // Will return the first match we find
  match({url}) {
    for (let extractor of Object.keys(extractors)) {
      for (let regex of extractors[extractor]) {
        if (regex.test(url)) {
          return {
            id: extractor,
            path: `${this.prefix}/dist/extractors/${extractor}.js`,
          };
        }
      }
    }
    return {};
  }
}

export default Extractors;

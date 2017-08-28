module.exports = {
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  extends: 'google',
  rules: {
    'comma-dangle': [2, 'always-multiline'],
    'max-len': [2, {
      code: 120,
      tabWidth: 2,
      ignoreUrls: true,
    }],
    'new-cap': 0,
    'require-jsdoc': 0,
    'camelcase': 0,
    'linebreak-style': 0,
    'padded-blocks': 0,
    'no-trailing-spaces': 0,
    'brace-style': 0,
  },
}

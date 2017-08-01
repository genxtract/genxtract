/**
 * Parse an HTML string
 * 
 * @param {String} html 
 * @return {Element}
 */
export const parseHtml = function parseHtml(html) {
  const div = window.document.createElement('div');
  div.innerHTML = html;
  return div;
};

/**
 * Return an empty object if passed in a null or undefined
 * 
 * @param {*} value
 * @return {*}
 */
export const maybe = function(value) {
  return value != null ? value : {}; // != null also covers undefined
};

/**
 * Capitalizes a string according to title case (first letter of each word)
 * 
 * @param {String} str
 * @return {String}
 */
export const toTitleCase = function(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

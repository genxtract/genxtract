/**
 * Return an empty object if passed in a null or undefined
 * 
 * @param {*} value
 * @return {*}
 */
export default function(value) {
  return value != null ? value : {}; // != null also covers undefined
};

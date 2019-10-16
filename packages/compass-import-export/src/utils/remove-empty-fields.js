/**
 * Based on mongoimport implementation.
 * https://github.com/mongodb/mongo-tools/blob/b1d68af3de3244484d8a7dddd939782d749b2b5c/mongoimport/common.go#L239
 * @returns {Object}
 * @param {Object} data
 */
function stripEmptyFields(data) {
  if (Array.isArray(data)) {
    return data.map(stripEmptyFields);
  } else if (typeof data !== 'object' || data === null || data === undefined) {
    return data;
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    return data;
  }
  return keys.reduce(function(doc, key) {
    if (typeof data[key] === 'string' && data[key] === '') {
      return doc;
    }
    doc[key] = stripEmptyFields(data[key]);
    return doc;
  }, {});
}

export default stripEmptyFields;

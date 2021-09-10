module.exports = function (app) {
  return async function existsEventually(selector, timeout) {
    try {
      // return true if it exists before the timeout expires
      return await app.client.waitForExist(selector, timeout);
    }
    catch (err) {
      // return false if not
      return false;
    }
  };
};

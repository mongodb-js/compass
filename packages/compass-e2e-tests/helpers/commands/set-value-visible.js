module.exports = function (app) {
  return async function setValueVisible(selector, value, timeout = 1000) {
    await app.client.waitForVisible(selector, timeout);
    await app.client.setValue(selector, value);
  };
};

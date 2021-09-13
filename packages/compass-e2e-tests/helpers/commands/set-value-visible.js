module.exports = function (app) {
  return async function setValueVisible(selector, value, timeout = 1000) {
    const client = app.wrappedClient;
    await client.waitForVisible(selector, timeout);
    await client.setValue(selector, value);
  };
};

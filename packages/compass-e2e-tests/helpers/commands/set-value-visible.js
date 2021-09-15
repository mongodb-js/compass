module.exports = function (app) {
  return async function setValueVisible(selector, value) {
    const { client } = app;
    await client.waitForVisible(selector);
    await client.setValue(selector, value);
  };
};

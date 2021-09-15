module.exports = function (app) {
  return async function setValueVisible(selector, value, timeout = 1000) {
    const { client } = app;
    const element = await client.$(selector);
    await element.waitForDisplayed({
      timeout,
      interval: 50,
    });
    await element.setValue(value);
  };
};

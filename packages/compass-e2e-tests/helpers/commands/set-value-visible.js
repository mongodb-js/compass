module.exports = function (app) {
  return async function setValueVisible(selector, value) {
    const { client } = app;
    const element = await client.$(selector);
    await element.waitForDisplayed();
    await element.setValue(value);
  };
};

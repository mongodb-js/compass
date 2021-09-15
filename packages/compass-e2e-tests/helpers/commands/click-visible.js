module.exports = function (app) {
  return async function clickVisible(selector) {
    const { client } = app;
    const element = await client.$(selector);
    await element.click();
  };
};

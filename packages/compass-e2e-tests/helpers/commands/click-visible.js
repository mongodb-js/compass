module.exports = function (app) {
  return async function clickVisible(selector) {
    // waitForVisible gives better errors than interacting with a non-existing
    // element
    const { client } = app;
    await client.waitForVisible(selector);
    await client.click(selector);
  };
};

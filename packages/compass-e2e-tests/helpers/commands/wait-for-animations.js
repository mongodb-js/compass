const _ = require('lodash');

module.exports = function (app) {
  return async function waitForAnimations(selector) {
    const { client } = app;

    const element = await client.$(selector);

    let previousResult = {
      ...(await element.getLocation()),
      ...(await element.getSize()),
    };
    // small delay to make sure that if it is busy animating it had time to move
    // before the first check
    await client.pause(50);
    await client.waitUntil(async function () {
      const result = {
        ...(await element.getLocation()),
        ...(await element.getSize()),
      };
      const stopped = _.isEqual(result, previousResult);
      previousResult = result;
      return stopped;
    });
  };
};

const _ = require('lodash');

module.exports = function (app) {
  return async function waitForAnimations(selector) {
    const { client } = app;

    const element = await client.$(selector);
    const elementId = element.value.ELEMENT;

    let previousResult = (await client.elementIdRect(elementId)).value;
    // small delay to make sure that if it is busy animating it had time to move
    // before the first check
    await client.pause(50);
    await client.waitUntil(async function () {
      const result = (await client.elementIdRect(elementId)).value;
      const stopped = _.isEqual(result, previousResult);
      previousResult = result;
      return stopped;
    });
  };
};

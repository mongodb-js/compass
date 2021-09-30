const _ = require('lodash');

module.exports = function (app) {
  return async function waitForAnimations(selector) {
    const { client } = app;

    const element = await client.$(selector);
    const elementId = element.value.ELEMENT;

    let previousResult = (await client.elementIdRect(elementId)).value;
    await client.waitUntil(async function () {
      const result = (await client.elementIdRect(elementId)).value;
      const stopped = _.isEqual(result, previousResult);
      previousResult = result;
      return stopped;
    });
  };
};

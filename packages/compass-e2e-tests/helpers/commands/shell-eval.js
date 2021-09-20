const { delay } = require('../delay');
const Selectors = require('../selectors');

module.exports = function (app) {
  return async function (str, parse = false, timeout = 10000) {
    const { client } = app;
    const shellContentElement = await client.$(Selectors.ShellContent);
    if (!(await shellContentElement.isDisplayed())) {
      await client.clickVisible(Selectors.ShellExpandButton);
    }
    await client.clickVisible(Selectors.ShellInput);
    // Might be marked with a deprecation warning, but can be used
    // https://github.com/webdriverio/webdriverio/issues/2076

    await client.keys(parse === true ? `JSON.stringify(${str})` : str);
    await client.keys('\uE007');

    const shellLoaderBarElement = await client.$(Selectors.ShellLoader);
    if (await shellLoaderBarElement.isDisplayed()) {
      await shellLoaderBarElement.waitForDisplayed({
        timeout,
        timeoutMsg: `Expected shell evaluation to finish in ${timeout}ms`,
        reverse: true,
        interval: 50,
      });
    }

    await delay(50);
    const shellOutputElements = await client.$$(Selectors.ShellOutput);
    const output = await shellOutputElements[
      shellOutputElements.length - 1
    ].getText();
    let result = Array.isArray(output) ? output.pop() : output;
    if (parse === true) {
      result = JSON.parse(result.replace(/(^['"]|['"]$)/g, ''));
    }
    return result;
  };
};

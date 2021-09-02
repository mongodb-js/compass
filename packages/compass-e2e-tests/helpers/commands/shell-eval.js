const { delay } = require('../delay');
const Selectors = require('../selectors');

module.exports = function(app) {
  return async function (str, parse = false, timeout = 10000) {
    if (!(await app.client.isVisible(Selectors.ShellContent))) {
      await app.client.clickVisible(Selectors.ShellExpandButton);
    }
    await app.client.clickVisible(Selectors.ShellInput);
    // Might be marked with a deprecation warning, but can be used
    // https://github.com/webdriverio/webdriverio/issues/2076
    await app.client.keys(parse === true ? `JSON.stringify(${str})` : str);
    await app.client.keys('\uE007');
    await app.client.waitUntil(
      async () => {
        return !(await app.client.isVisible(Selectors.ShellLoader));
      },
      timeout,
      `Expected shell evaluation to finish in ${timeout}ms`,
      50
    );
    await delay(50);
    const output = await app.client.getText(Selectors.ShellOutput);
    let result = Array.isArray(output) ? output.pop() : output;
    if (parse === true) {
      result = JSON.parse(result.replace(/(^['"]|['"]$)/g, ''));
    }
    return result;
  };
};

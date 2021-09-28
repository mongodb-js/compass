const { delay } = require('../delay');
const Selectors = require('../selectors');

module.exports = function (app) {
  return async function (str, parse = false, timeout) {
    const { client } = app;
    if (!(await client.isVisible(Selectors.ShellContent))) {
      await client.clickVisible(Selectors.ShellExpandButton);
    }
    await client.clickVisible(Selectors.ShellInput);
    // Might be marked with a deprecation warning, but can be used
    // https://github.com/webdriverio/webdriverio/issues/2076
    await client.keys(parse === true ? `JSON.stringify(${str})` : str);
    await client.keys('\uE007');
    await client.waitUntil(
      async () => {
        return !(await client.isVisible(Selectors.ShellLoader));
      },
      timeout,
      `Expected shell evaluation to finish before timeout`,
      50
    );
    await delay(50);
    const output = await client.getText(Selectors.ShellOutput);
    let result = Array.isArray(output) ? output.pop() : output;
    if (parse === true) {
      result = JSON.parse(result.replace(/(^['"]|['"]$)/g, ''));
    }
    return result;
  };
};

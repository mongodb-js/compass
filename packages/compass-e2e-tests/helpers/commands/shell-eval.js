const { retryWithBackoff } = require('../retry-with-backoff');
const Selectors = require('../selectors');

module.exports = function (app) {
  async function getOutputText() {
    const { client } = app;

    const elements = await client.$$(Selectors.ShellOutput);
    return Promise.all(
      elements.map((element) => {
        return element.getText();
      })
    );
  }

  return async function (str, parse = false) {
    const { client } = app;
    let numLines;

    await retryWithBackoff(async function () {
      const shellContentElement = await client.$(Selectors.ShellContent);
      if (!(await shellContentElement.isDisplayed())) {
        await client.clickVisible(Selectors.ShellExpandButton);
      }

      numLines = (await getOutputText()).length;

      await client.clickVisible(Selectors.ShellInput);
    });

    const command = parse === true ? `JSON.stringify(${str})` : str;
    // Might be marked with a deprecation warning, but can be used
    // https://github.com/webdriverio/webdriverio/issues/2076
    await client.keys(command);
    await client.keys('\uE007');

    // wait until more output appears
    await client.waitUntil(async () => {
      const lines = await getOutputText();
      // first the command we send appears then later the response
      return lines.length > numLines + 1;
    });

    const shellOutputElements = await client.$$(Selectors.ShellOutput);
    const output = await shellOutputElements[
      shellOutputElements.length - 1
    ].getText();
    let result = Array.isArray(output) ? output.pop() : output;
    if (parse === true) {
      try {
        result = JSON.parse(result.replace(/(^['"]|['"]$)/g, ''));
      } catch (err) {
        // just leave it unparsed for now if there's a parse error because
        // that's really helpful when debugging
      }
    }
    return result;
  };
};

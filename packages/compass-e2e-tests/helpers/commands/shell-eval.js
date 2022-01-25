const { retryWithBackoff } = require('../retry-with-backoff');
const Selectors = require('../selectors');

module.exports = function (compass) {
  async function getOutputText() {
    const { browser } = compass;

    const elements = await browser.$$(Selectors.ShellOutput);
    return Promise.all(
      elements.map((element) => {
        return element.getText();
      })
    );
  }

  return async function (str, parse = false) {
    const { browser } = compass;
    let numLines;

    await retryWithBackoff(async function () {
      const shellContentElement = await browser.$(Selectors.ShellContent);
      if (!(await shellContentElement.isDisplayed())) {
        await browser.clickVisible(Selectors.ShellExpandButton);
      }

      numLines = (await getOutputText()).length;

      await browser.clickVisible(Selectors.ShellInput);
    });

    const command = parse === true ? `JSON.stringify(${str})` : str;
    // Might be marked with a deprecation warning, but can be used
    // https://github.com/webdriverio/webdriverio/issues/2076
    await browser.keys(command);
    await browser.keys(['Enter']);

    // wait until more output appears
    await browser.waitUntil(
      async () => {
        const lines = await getOutputText();
        // first the command we send appears then later the response
        return lines.length > numLines + 1;
      },
      { timeout: 10000 }
    );

    const shellOutputElements = await browser.$$(Selectors.ShellOutput);
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

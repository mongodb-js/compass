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
    const shellContentElement = await browser.$(Selectors.ShellContent);
    if (!(await shellContentElement.isDisplayed())) {
      await browser.clickVisible(Selectors.ShellExpandButton);
    }

    const numLines = (await getOutputText()).length;

    await browser.clickVisible(Selectors.ShellInput);
    // Might be marked with a deprecation warning, but can be used
    // https://github.com/webdriverio/webdriverio/issues/2076

    const command = parse === true ? `JSON.stringify(${str})` : str;
    await browser.keys(command);
    await browser.keys('\uE007');

    // wait until more output compassears
    await browser.waitUntil(async () => {
      const lines = await getOutputText();
      // first the command we send compassears then later the response
      return lines.length > numLines + 1;
    });

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

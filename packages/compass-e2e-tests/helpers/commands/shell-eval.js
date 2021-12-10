const Selectors = require('../selectors');

module.exports = function (app, page, commands) {
  async function getOutputText() {
    const elements = await page.$$(Selectors.ShellOutput);
    return Promise.all(
      elements.map((element) => {
        return element.textContent();
      })
    );
  }

  return async function (str, parse = false) {
    const shellContent = page.locator(Selectors.ShellContent);
    if (!(await shellContent.isVisible())) {
      await page.click(Selectors.ShellExpandButton);
    }

    const numLines = (await getOutputText()).length;

    await page.click(Selectors.ShellInput);
    // Might be marked with a deprecation warning, but can be used
    // https://github.com/webdriverio/webdriverio/issues/2076

    const command = parse === true ? `JSON.stringify(${str})` : str;

    // TODO: this has to be replaced with something on an element, I think
    await client.keys(command);
    await client.keys('\uE007');

    // wait until more output appears
    await commands.waitUntil(async () => {
      const lines = await getOutputText();
      // first the command we send appears then later the response
      return lines.length > numLines + 1;
    });

    const shellOutputElements = await page.$$(Selectors.ShellOutput);
    const output = await shellOutputElements[
      shellOutputElements.length - 1
    ].textContent();
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

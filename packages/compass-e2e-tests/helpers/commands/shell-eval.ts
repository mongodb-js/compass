import type { Browser } from 'webdriverio';
import retryWithBackoff from '../retry-with-backoff';
import * as Commands from '../commands';
import * as Selectors from '../selectors';

async function getOutputText(browser: Browser<'async'>): Promise<string[]> {
  const elements = await browser.$$(Selectors.ShellOutput);
  return Promise.all(
    elements.map((element) => {
      return element.getText();
    })
  );
}

export async function shellEval(
  browser: Browser<'async'>,
  str: string,
  parse = false
): Promise<string> {
  let numLines: number;

  await retryWithBackoff(async function () {
    const shellContentElement = await browser.$(Selectors.ShellContent);
    if (!(await shellContentElement.isDisplayed())) {
      await Commands.clickVisible(browser, Selectors.ShellExpandButton);
    }

    numLines = (await getOutputText(browser)).length;

    await Commands.clickVisible(browser, Selectors.ShellInput);
  });

  const command = parse === true ? `JSON.stringify(${str})` : str;
  // Might be marked with a deprecation warning, but can be used
  // https://github.com/webdriverio/webdriverio/issues/2076
  await browser.keys(command);
  await browser.keys(['Enter']);

  // wait until more output appears
  await browser.waitUntil(
    async () => {
      const lines = await getOutputText(browser);
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
}

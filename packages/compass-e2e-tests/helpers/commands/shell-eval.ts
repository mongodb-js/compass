import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

async function getOutputText(browser: CompassBrowser): Promise<string[]> {
  const elements = await browser.$$(Selectors.ShellOutput);
  return Promise.all(
    elements.map((element) => {
      return element.getText();
    })
  );
}

export async function shellEval(
  browser: CompassBrowser,
  str: string,
  parse = false
): Promise<string> {
  await browser.showShell();

  const numLines = (await getOutputText(browser)).length;

  const command = parse === true ? `JSON.stringify(${str})` : str;

  await browser.setAceValue(Selectors.ShellInputEditor, command);
  await browser.keys(['Enter']);

  // wait until more output appears
  await browser.waitUntil(async () => {
    const lines = await getOutputText(browser);
    return lines.length > numLines;
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
      console.error('Could not parse result:', result);
    }
  }

  await browser.hideShell();

  return result;
}

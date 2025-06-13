import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

async function getOutputText(browser: CompassBrowser): Promise<string[]> {
  return await browser.$$(Selectors.ShellOutput).map((element) => {
    return element.getText();
  });
}

export async function shellEval(
  browser: CompassBrowser,
  connectionName: string,
  input: string | string[],
  parse = false
): Promise<string> {
  // Keep in mind that for multiple connections this will open a new tab and
  // focus it.
  await browser.openShell(connectionName);

  const strings = Array.isArray(input) ? input : [input];

  for (const str of strings) {
    const numLines = (await getOutputText(browser)).length;

    const command = parse === true ? `JSON.stringify(${str})` : str;

    await browser.setCodemirrorEditorValue(Selectors.ShellInputEditor, command);
    await browser.keys(['Enter']);

    // wait until more output appears
    await browser.waitUntil(async () => {
      const lines = await getOutputText(browser);
      if (
        lines.length >
        /**
         * input line becomes an output line on enter press, so we are waiting
         * for two new lines to appear, not just one
         */
        numLines + 1
      ) {
        // make sure the prompt shows up before entering another line or continueing on
        await browser
          .$(`${Selectors.ShellInput} [aria-label="Chevron Right Icon"]`)
          .waitForDisplayed();
        return true;
      }
      return false;
    });
  }

  const output = await getOutputText(browser);

  let result = Array.isArray(output) ? output.pop() : output;

  if (typeof result === 'undefined') {
    throw new Error('No shell output found');
  }

  if (parse === true) {
    try {
      result = JSON.parse(result);
    } catch {
      // just leave it unparsed for now if there's a parse error because
      // that's really helpful when debugging
      console.error('Could not parse result:', result);
    }
  }

  // For multiple connections we're currently making the assumption that closing
  // the shell will put the user back on the tab they were on before
  // opening the shell tab. This might not stay true as we start testing more
  // complicated user flows.
  await browser.closeShell(connectionName);

  return result as string;
}

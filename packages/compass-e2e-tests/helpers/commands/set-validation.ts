import { Browser } from 'webdriverio';
import * as Commands from '../commands';
import * as Selectors from '../selectors';

export async function setValidation(
  browser: Browser<'async'>,
  value: string
): Promise<void> {
  await Commands.setAceValue(browser, Selectors.ValidationEditor, value);

  // it should eventually detect that the text changed
  const validationActionMessageElement = await browser.$(
    Selectors.ValidationActionMessage
  );
  await validationActionMessageElement.waitForDisplayed();

  await Commands.clickVisible(browser, Selectors.UpdateValidationButton);

  // both buttons should become hidden if it succeeds
  await validationActionMessageElement.waitForDisplayed({
    // since this is a db query the default timeout might not be long enough
    timeout: 30_000,
    reverse: true,
  });

  const updateValidationButtonElement = await browser.$(
    Selectors.UpdateValidationButton
  );
  await updateValidationButtonElement.waitForDisplayed({
    reverse: true,
  });
}

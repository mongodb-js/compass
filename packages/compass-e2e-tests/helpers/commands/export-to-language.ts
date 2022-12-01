import clipboard from 'clipboardy';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

type ExportToLanguageOptions = {
  includeImportStatements?: boolean;
  includeDriverSyntax?: boolean;
  useBuilders?: boolean;
};

export async function exportToLanguage(
  browser: CompassBrowser,
  language: string,
  options?: ExportToLanguageOptions
): Promise<string> {
  const exportModal = await browser.$(Selectors.ExportToLanguageModal);
  await exportModal.waitForDisplayed();

  // pick the language
  await browser.$(Selectors.ExportToLanguageLanguageField).click();
  const listBox = await browser.$(Selectors.ExportToLanguageLanguageListbox);
  await listBox.waitForDisplayed();
  const languageElement = await listBox.$(`[value="${language}"]`);
  await languageElement.waitForDisplayed();
  await languageElement.click();

  if (options?.includeImportStatements === true) {
    const importsCheckbox = await browser.$(
      Selectors.ExportToLanguageImportsCheckbox
    );
    const importsLabel = await importsCheckbox.parentElement();
    if (!(await importsCheckbox.isSelected())) {
      await importsLabel.click();
    }
  }

  // not C#
  if (options?.includeDriverSyntax === true) {
    const driverCheckbox = await browser.$(
      Selectors.ExportToLanguageDriverCheckbox
    );
    const driverLabel = await driverCheckbox.parentElement();
    if (!(await driverCheckbox.isSelected())) {
      await driverLabel.click();
    }
  }

  // only Java, only when exporting from Documents tab
  if (options?.useBuilders === true) {
    const buildersCheckbox = await browser.$(
      Selectors.ExportToLanguageBuildersCheckbox
    );
    const buildersLabel = await buildersCheckbox.parentElement();
    if (!(await buildersCheckbox.isSelected())) {
      await buildersLabel.click();
    }
  }

  let text = '';

  if (process.env.COMPASS_E2E_DISABLE_CLIPBOARD_USAGE === 'true') {
    text = await browser.$(Selectors.ExportToLanguageQueryOutput).getText();
  } else {
    // copy the text to and from the clipboard so we can return it later
    await browser.clickVisible(Selectors.ExportToLanguageCopyOutputButton);
    text = await clipboard.read();
  }

  await browser.screenshot('export-to-language-modal.png');

  // close the modal again
  await browser.clickVisible(Selectors.ExportToLanguageCloseButton);
  await exportModal.waitForDisplayed({ reverse: true });

  // normalize copied text so that it's the same for all platforms
  return text.replace(/\r\n/g, '\n');
}

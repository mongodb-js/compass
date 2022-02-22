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
  await browser.clickVisible(Selectors.ExportToLanguageLanguageField);
  const listBox = await browser.$(Selectors.ExportToLanguageLanguageListbox);
  await listBox.waitForDisplayed();
  const languageElement = await listBox.$(`div=${language}`);
  await languageElement.waitForDisplayed();
  await languageElement.click();

  if (options?.includeImportStatements === true) {
    const importsCheckbox = await browser.$(
      Selectors.ExportToLanguageImportsCheckbox
    );
    await importsCheckbox.waitForDisplayed();
    if (!(await importsCheckbox.isSelected())) {
      await importsCheckbox.click();
    }
  }

  // not C#
  if (options?.includeDriverSyntax === true) {
    const driverCheckbox = await browser.$(
      Selectors.ExportToLanguageDriverCheckbox
    );
    await driverCheckbox.waitForDisplayed();
    if (!(await driverCheckbox.isSelected())) {
      await driverCheckbox.click();
    }
  }

  // only Java, only when exporting from Documents tab
  if (options?.useBuilders === true) {
    const buildersCheckbox = await browser.$(
      Selectors.ExportToLanguageBuildersCheckbox
    );
    await buildersCheckbox.waitForDisplayed();
    if (!(await buildersCheckbox.isSelected())) {
      await buildersCheckbox.click();
    }
  }

  // copy the text to and from the clipboard so we can return it later
  await browser.clickVisible(Selectors.ExportToLanguageCopyOutputButton);
  const text = await clipboard.read();

  // close the modal again
  await browser.clickVisible(Selectors.ExportToLanguageCloseButton);
  await exportModal.waitForDisplayed({ reverse: true });

  return text;
}

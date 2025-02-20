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
  const exportModal = browser.$(Selectors.ExportToLanguageModal);
  await exportModal.waitForDisplayed();

  // pick the language
  await browser.waitUntil(async () => {
    const button = browser.$(Selectors.ExportToLanguageLanguageField);
    await browser.clickVisible(button);
    return (await button.getAttribute('aria-expanded')) === 'true';
  });

  const listBox = browser.$(Selectors.ExportToLanguageLanguageListbox);
  await listBox.waitForDisplayed();
  const languageElement = listBox.$(`[value="${language}"]`);
  await languageElement.waitForDisplayed();
  await languageElement.click();

  if (options?.includeImportStatements === true) {
    const importsCheckbox = browser.$(
      Selectors.ExportToLanguageImportsCheckbox
    );
    const importsLabel = importsCheckbox.parentElement();
    if (!(await importsCheckbox.isSelected())) {
      await importsLabel.click();
    }
  }

  // not C#
  if (options?.includeDriverSyntax === true) {
    const driverCheckbox = browser.$(Selectors.ExportToLanguageDriverCheckbox);
    const driverLabel = driverCheckbox.parentElement();
    if (!(await driverCheckbox.isSelected())) {
      await driverLabel.click();
    }
  }

  // only Java, only when exporting from Documents tab
  if (options?.useBuilders === true) {
    const buildersCheckbox = browser.$(
      Selectors.ExportToLanguageBuildersCheckbox
    );
    const buildersLabel = buildersCheckbox.parentElement();
    if (!(await buildersCheckbox.isSelected())) {
      await buildersLabel.click();
    }
  }

  // We are not testing the leafygreen copy button here because clicking it (and
  // probably the follow-up tooltip that shows up) breaks clicking the close
  // buttons in the modal and it's hard to coordinate the flow to avoid
  const text = await browser.$(Selectors.ExportToLanguageQueryOutput).getText();

  // close the modal again
  await browser.clickVisible(Selectors.ExportToLanguageCloseButton);
  await exportModal.waitForDisplayed({ reverse: true });

  // normalize copied text so that it's the same for all platforms
  return text.replace(/\r\n/g, '\n').replace(/\n+/g, '\n');
}

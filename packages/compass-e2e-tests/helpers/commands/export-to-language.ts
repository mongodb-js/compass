import clipboard from 'clipboardy';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

type ExportToLanguageOptions = {
  includeImportStatements?: boolean,
  includeDriverSyntax?: boolean,
  useBuilders?: boolean
};

export async function exportToLanguage(
  browser: CompassBrowser,
  language: string,
  options?: ExportToLanguageOptions
): Promise<string> {

  const exportModal = await browser.$(
    '[data-test-id="export-to-lang-modal"]'
  );
  await exportModal.waitForDisplayed();

  await browser.clickVisible('[data-test-id="select-lang-field"]');

  const listBox = await browser.$(
    '[data-test-id="select-lang-field"] [role="listbox"]'
  );
  await listBox.waitForDisplayed();

  const javaElement = await listBox.$(`div=${language}`);
  await javaElement.waitForDisplayed();
  await javaElement.click();

  if (options?.includeImportStatements === true) {
    const importsCheckbox = await browser.$(
      '[data-test-id="export-to-lang-checkbox-imports"]'
    );
    await importsCheckbox.waitForDisplayed();
    if (!(await importsCheckbox.isSelected())) {
      await importsCheckbox.click();
    }
  }

  // not C#
  if (options?.includeDriverSyntax === true) {
    const driverCheckbox = await browser.$(
      '[data-test-id="export-to-lang-checkbox-driver"]'
    );
    await driverCheckbox.waitForDisplayed();
    if (!(await driverCheckbox.isSelected())) {
      await driverCheckbox.click();
    }
  }

  // only Java, only when exporting from Documents tab
  if (options?.useBuilders === true) {
    const buildersCheckbox = await browser.$(
      '[data-test-id="export-to-lang-checkbox-builders"]'
    );
    await buildersCheckbox.waitForDisplayed();
    if (!(await buildersCheckbox.isSelected())) {
      await buildersCheckbox.click();
    }
  }

  await browser.clickVisible('[data-test-id="export-to-lang-copy-output"]');

  const text = await clipboard.read();

  // close the modal again
  await browser.clickVisible(
    '[data-test-id="export-to-lang-modal"] .modal-footer .btn-default'
  );
  await exportModal.waitForDisplayed({ reverse: true });

  return text;
}
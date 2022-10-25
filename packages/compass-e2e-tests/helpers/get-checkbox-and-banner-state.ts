import type { CompassBrowser } from '../helpers/compass-browser';
import * as Selectors from '../helpers/selectors';

export async function getCheckboxAndBannerState(
  browser: CompassBrowser,
  setting: string
) {
  const settingSelector = `${Selectors.SettingsModal} [data-testid="setting-${setting}"]`;
  const checkbox = await browser.$(`${settingSelector} input[type="checkbox"]`);
  const disabled = await checkbox.getAttribute('disabled');
  const value = await checkbox.getAttribute('aria-checked'); // .getValue() always returns 'on'?
  const banner = await browser.$(
    `${settingSelector} [data-testid="set-cli-banner"], ${settingSelector} [data-testid="set-global-banner"]`
  );
  const bannerText = (await banner.isExisting())
    ? await banner.getText()
    : null;
  return { disabled, value, bannerText };
}

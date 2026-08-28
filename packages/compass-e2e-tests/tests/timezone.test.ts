import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  getDefaultConnectionNames,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';
import * as Selectors from '../helpers/selectors.ts';
import { createDatesCollection } from '../helpers/mongo-clients.ts';
import { isTestingWeb } from '../helpers/test-runner-context.ts';

const BERLIN = 'Europe/Berlin';
const COLLECTION_NAME = 'dates';
const INSERTED_DATE = new Date('2021-10-01T09:00:00.000Z');

async function formatInTimezone(
  browser: CompassBrowser,
  timeZone: string
): Promise<string> {
  const formatted = await browser.execute(
    (_iso: string, _timezone: string): string => {
      // We format the date in system's default locale
      return new Intl.DateTimeFormat(undefined, {
        timeZone: _timezone,
        dateStyle: 'long',
        timeStyle: 'long',
      }).format(new Date(_iso));
    },
    INSERTED_DATE.toISOString(),
    timeZone
  );
  return formatted;
}

async function getTimezoneHintText(
  browser: CompassBrowser,
  parentSelector: string
): Promise<string> {
  const hint = browser.$(parentSelector).$(Selectors.DateWithTimezoneHint);
  await hint.waitForDisplayed();
  return await hint.getText();
}

async function changeTimezone(browser: CompassBrowser, timezone: string) {
  await browser.openSettingsModal('general');

  const inputSelector = Selectors.SettingsComboboxInputElement('timezone');
  await browser.clickVisible(inputSelector);
  await browser.setValueVisible(inputSelector, timezone, { skipFocus: true });

  // Options are labelled with the UTC offset in front of the timezone name, so
  // we can only match on a substring here.
  const option = browser.$(`[role="listbox"]`).$(`li*=${timezone}`);
  await option.waitForDisplayed();
  await option.click();
  await browser.$(`[role="listbox"]`).waitForDisplayed({ reverse: true });

  await browser.clickVisible(Selectors.SaveSettingsButton);
  await browser.waitForOpenModal(Selectors.SettingsModal, {
    reverse: true,
  });
  expect(await browser.getFeature('timezone')).to.equal(timezone);
}

function bsonFormattedDate() {
  // We show the value with the UTC offset in the raw BSON value
  return `ISODate('${INSERTED_DATE.toISOString().replace('Z', '+00:00')}')`;
}

describe('Timezone', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let connectionName: string;

  before(async function () {
    if (isTestingWeb()) {
      this.skip();
    }
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    connectionName = getDefaultConnectionNames()[0];
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createDatesCollection(COLLECTION_NAME, INSERTED_DATE);
    await browser.setFeature('timezone', 'UTC');
    await browser.disconnectAll();

    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      connectionName,
      'test',
      COLLECTION_NAME,
      'Documents'
    );
  });

  afterEach(async function () {
    await browser.setFeature('timezone', 'UTC');
    await screenshotIfFailed(compass, this.currentTest);
  });

  after(async function () {
    await cleanup(compass);
  });

  it('shows datetime in preferred timezone in addition to default view - when viewing', async function () {
    const documentSelector = Selectors.DocumentListEntry;
    await browser.$(documentSelector).waitForDisplayed();

    expect(await getTimezoneHintText(browser, documentSelector)).to.include(
      await formatInTimezone(browser, 'UTC')
    );

    // The raw BSON value is always rendered as the UTC ISO string, only the
    // hint next to it follows the preference.
    expect(await browser.$(documentSelector).getText()).to.include(
      bsonFormattedDate()
    );

    await changeTimezone(browser, BERLIN);

    const expected = await formatInTimezone(browser, BERLIN);
    await browser.waitUntil(async () => {
      return (await getTimezoneHintText(browser, documentSelector)).includes(
        expected
      );
    });

    // It should still show the default ISO string in the raw BSON value.
    expect(await browser.$(documentSelector).getText()).to.include(
      bsonFormattedDate()
    );
  });

  it('shows datetime in preferred timezone in addition to default view - when editing', async function () {
    await changeTimezone(browser, BERLIN);

    const documentSelector = Selectors.DocumentListEntry;
    await browser.$(documentSelector).waitForDisplayed();
    await browser.hover(documentSelector);
    await browser.clickVisible(
      browser.$(documentSelector).$(Selectors.EditDocumentButton)
    );

    // The value editor is now an input, but the hint stays next to it.
    await browser
      .$(documentSelector)
      .$(Selectors.HadronDocumentValueEditor)
      .waitForDisplayed();

    const expected = await formatInTimezone(browser, BERLIN);
    await browser.waitUntil(async () => {
      return (await getTimezoneHintText(browser, documentSelector)).includes(
        expected
      );
    });
  });
});

import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser.ts';
import { startTelemetryServer } from '../helpers/telemetry.ts';
import type { Telemetry } from '../helpers/telemetry.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  getDefaultConnectionNames,
  screenshotPathName,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';
import * as Selectors from '../helpers/selectors.ts';
import {
  isTestingWeb,
  isTestingWebAtlasCloud,
} from '../helpers/test-runner-context.ts';

describe('MongoDB Assistant (with real backend)', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  let setAIOptIn: (newValue: boolean) => Promise<void>;
  let setAIFeatures: (newValue: boolean) => Promise<void>;

  const dbName = 'test';
  const collectionName = 'assistant-test';

  before(async function () {
    // Skipping tests for environments where real backend is not available
    if (
      // Knowledge API doesn't allow requests from localhost
      isTestingWeb() ||
      // Knowledge API doesn't allow requests from Evergreen in non-prod
      // envioronments that we're using for WebAtlasCloud tests
      isTestingWebAtlasCloud()
    ) {
      this.skip();
    }

    try {
      telemetry = await startTelemetryServer();
      compass = await init(this.test?.fullTitle());

      setAIFeatures = async (newValue: boolean) => {
        await browser.setFeature('enableGenAIFeatures', newValue);
        await browser.setFeature('enableGenAISampleDocumentPassing', newValue);
        await browser.setFeature(
          'enableGenAIToolCallingAtlasProject',
          newValue
        );
        await browser.setFeature('enableGenAIToolCalling', newValue);

        if (newValue) {
          await browser.$(Selectors.AssistantDrawerButton).waitForDisplayed();
          // TODO: also wait for the tools to show as on
        } else {
          await browser.$(Selectors.AssistantDrawerButton).waitForDisplayed({
            reverse: true,
          });
          // TODO: also wait for the tools to show as off
        }
      };

      setAIOptIn = async (newValue: boolean) => {
        await browser.setFeature('optInGenAIFeatures', newValue);
      };

      browser = compass.browser;

      await browser.setupDefaultConnections();
      await browser.connectToDefaults();
      await browser.selectConnectionMenuItem(
        getDefaultConnectionNames(0),
        Selectors.CreateDatabaseButton,
        false
      );
      await browser.addDatabase(dbName, collectionName);

      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        dbName,
        collectionName,
        'Aggregations'
      );

      await setAIOptIn(true);
      await setAIFeatures(true);
    } catch (err) {
      await browser.screenshot(screenshotPathName('before-MongoDB-Assistant'));
      throw err;
    }
  });

  after(async function () {
    await cleanup(compass);
    await telemetry?.stop();
  });

  beforeEach(async function () {
    await browser.openAssistantDrawer();
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    try {
      await browser.clearChat();
    } catch (err) {
      await browser.screenshot(
        screenshotPathName('afterEach-MongoDB-Assistant')
      );
      throw err;
    }

    // Close the drawer if open to provide a clean environment for the next test
    const drawerCloseButton = browser.$(Selectors.AssistantDrawerCloseButton);
    if (await drawerCloseButton.isDisplayed()) {
      await browser.clickVisible(drawerCloseButton);
      await drawerCloseButton.waitForDisplayed({ reverse: true });
    }
  });

  it('sends a message that results in a tool call, which runs without approval and renders the response', async function () {
    const chatMessages = browser.$(Selectors.AssistantChatMessages);
    // The real AI backend is non-deterministic and may respond with text
    // instead of calling a tool, so the whole flow is retried.
    for (let attempt = 1; attempt <= 3; attempt++) {
      const message = `Use the list-collections tool to list all collections in the ${dbName} database`;
      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      await chatInput.waitForDisplayed();
      await chatInput.setValue(message);
      await browser.clickVisible(Selectors.AssistantChatSubmitButton);

      try {
        await browser.waitUntil(
          async () => {
            const text = await chatMessages.getText();
            expect(text).to.include('Ran list-collections');
            expect(text).to.include('structuredContent');
            expect(text).to.include('totalCount');
            return true;
          },
          { timeout: 50_000 }
        );
        // list-collections is read-only, so no approval prompt is shown
        expect(await chatMessages.$('button=Run').isDisplayed()).to.equal(
          false
        );
        return;
      } catch (err) {
        await browser.screenshot(
          screenshotPathName(
            `assistant-tool-call-attempt-${attempt}-${Date.now()}`
          )
        );
        if (attempt === 3) {
          throw err;
        }
        await browser.clearChat();
      }
    }
  });
});

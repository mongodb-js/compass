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
import { expect } from 'chai';

describe('MongoDB Assistant (with real backend)', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  let setAIOptIn: (newValue: boolean) => Promise<void>;
  let setAIFeatures: (newValue: boolean) => Promise<void>;

  const dbName = 'test';
  const collectionName = 'assistant-test';

  before(async function () {
    if (isTestingWeb() && !isTestingWebAtlasCloud()) {
      // The assistant does not allow requests from localhost:7777 yet
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
    if (telemetry) {
      await telemetry.stop();
    }
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

  /**
   * Sends a message and waits for the tool call approval UI to appear.
   * The real AI backend is non-deterministic and may respond with text
   * instead of calling a tool, so this retries up to 3 times.
   */
  async function sendAndWaitForToolCall(message: string) {
    const chatMessages = browser.$(Selectors.AssistantChatMessages);

    for (let attempt = 1; attempt <= 3; attempt++) {
      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      await chatInput.waitForDisplayed();
      await chatInput.setValue(message);
      await browser.clickVisible(Selectors.AssistantChatSubmitButton);

      // Wait for user message to appear
      await browser.waitUntil(async () => {
        const messages = await browser.getDisplayedMessages();
        expectSome(messages, (m) => m.role === 'user' && m.text === message);
        return true;
      });

      // Wait for tool call approval UI (Run button indicates tool call)
      try {
        await chatMessages
          .$('button=Run')
          .waitForDisplayed({ timeout: 20_000 });
        return chatMessages;
      } catch {
        const screenshotName = `sendAndWaitForToolCall-attempt-${attempt}-${Date.now()}`;
        await browser.screenshot(screenshotPathName(screenshotName));
        if (attempt < 3) {
          await browser.clearChat();
          continue;
        }
        throw new Error(
          `Tool call approval UI did not appear after ${attempt} attempts`
        );
      }
    }

    throw new Error('Unreachable');
  }

  it('sends a message that results in a tool call request, approves it and renders the response', async function () {
    const chatMessages = await sendAndWaitForToolCall(
      'Use the list-databases tool to list all databases'
    );

    // Approve the tool call
    await browser.clickVisible(chatMessages.$('button=Run'));

    // Wait for the tool to finish running: the "Ran" text indicates completion
    await browser.waitUntil(
      async () => {
        const text = await chatMessages.getText();
        expect(text).to.include('Ran list-databases');
        return true;
      },
      { timeout: 30_000 }
    );

    // Expand the tool call card to see the response
    const expandButton = chatMessages.$(
      'button[aria-label="Expand additional content"]'
    );
    await expandButton.waitForDisplayed();
    await browser.clickVisible(expandButton);

    // Wait for the expanded content to include the response with structuredContent.databases
    await browser.waitUntil(
      async () => {
        // TODO: pick out just the pre tabparse this as JSON rather and then check the object
        const text = await chatMessages.getText();
        expect(text).to.include('structuredContent');
        expect(text).to.include('databases');
        return true;
      },
      {
        timeout: 30_000,
      }
    );
  });

  it('sends a message that results in a tool call request, denies it and renders the response', async function () {
    const chatMessages = await sendAndWaitForToolCall(
      'Use the list-databases tool to list all databases'
    );

    // Deny the tool call
    await browser.clickVisible(chatMessages.$('button=Cancel'));

    // Wait for the tool to be cancelled: the "Cancelled" text indicates completion
    await browser.waitUntil(
      async () => {
        const text = await chatMessages.getText();
        expect(text).to.include('Cancelled list-databases');
        return true;
      },
      { timeout: 30_000 }
    );
  });
});

function expectSome<T>(array: T[], predicate: (item: T) => boolean) {
  if (!array.some(predicate)) {
    throw new Error(
      `Expected some item in array to satisfy ${predicate.toString()}, but got: ${JSON.stringify(
        array
      )}`
    );
  }
}

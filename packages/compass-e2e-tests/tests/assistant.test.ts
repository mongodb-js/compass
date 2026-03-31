import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  init,
  cleanup,
  screenshotIfFailed,
  getDefaultConnectionNames,
  screenshotPathName,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  isTestingWeb,
  isTestingWebAtlasCloud,
} from '../helpers/test-runner-context';

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
    await telemetry.stop();
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
        return messages.some((m) => m.role === 'user' && m.text === message);
      });

      // Wait for tool call approval UI (Run button indicates tool call)
      try {
        await chatMessages
          .$('button=Run')
          .waitForDisplayed({ timeout: 20_000 });
        return chatMessages;
      } catch {
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
        return text.includes('Ran list-databases');
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
        const text = await chatMessages.getText();
        return text.includes('structuredContent') && text.includes('databases');
      },
      {
        timeout: 30_000,
        timeoutMsg:
          'Expected tool call response to include structuredContent.databases',
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
        return text.includes('Cancelled list-databases');
      },
      { timeout: 30_000 }
    );

    // Wait for the assistant's final text response to appear
    await browser.waitUntil(
      async () => {
        const messages = await browser.getDisplayedMessages();
        return messages.some(
          (m) => m.role === 'assistant' && m.text.length > 0
        );
      },
      {
        timeout: 30_000,
        timeoutMsg: `Expected assistant response to follow the cancelled tool call`,
      }
    );
  });
});

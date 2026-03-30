import { expect } from 'chai';

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

describe('MongoDB Assistant (with real backend)', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  let setAIOptIn: (newValue: boolean) => Promise<void>;
  let setAIFeatures: (newValue: boolean) => Promise<void>;

  const dbName = 'test';
  const collectionName = 'assistant-test';

  before(async function () {
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

  it('sends a message that results in a tool call request, approves it and renders the response', async function () {
    // Send a message that should trigger the list-databases tool call
    const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
    await chatInput.waitForDisplayed();
    await chatInput.setValue(
      'Use the list-databases tool to list all databases'
    );
    await browser.clickVisible(Selectors.AssistantChatSubmitButton);

    // Wait for the user message to appear
    await browser.waitUntil(async () => {
      const messages = await browser.getDisplayedMessages();
      return messages.some(
        (m) =>
          m.role === 'user' &&
          m.text === 'Use the list-databases tool to list all databases'
      );
    });

    // Wait for the tool call approval UI to appear (the "Run" button inside the chat)
    const chatMessages = browser.$(Selectors.AssistantChatMessages);
    const runButton = chatMessages.$('button=Run');
    await runButton.waitForDisplayed({ timeout: 30_000 });

    // Approve the tool call
    await browser.clickVisible(runButton);

    // Wait for the tool to finish running: the "Ran" text indicates completion
    await browser.waitUntil(
      async () => {
        const text = await chatMessages.getText();
        return text.includes('Ran list-databases');
      },
      { timeout: 30_000 }
    );

    // Wait for the assistant's final text response to appear and contain the collection
    await browser.waitUntil(
      async () => {
        const messages = await browser.getDisplayedMessages();
        return messages.some(
          (m) => m.role === 'assistant' && m.text.includes(collectionName)
        );
      },
      {
        timeout: 30_000,
        timeoutMsg: `Expected assistant response to include the collection name: ${collectionName}`,
      }
    );
  });

  it('sends a message that results in a tool call request, denies it and renders the response', async function () {
    // Send a message that should trigger the list-databases tool call
    const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
    await chatInput.waitForDisplayed();
    await chatInput.setValue(
      'Use the list-databases tool to list all databases'
    );
    await browser.clickVisible(Selectors.AssistantChatSubmitButton);

    // Wait for the user message to appear
    await browser.waitUntil(async () => {
      const messages = await browser.getDisplayedMessages();
      return messages.some(
        (m) =>
          m.role === 'user' &&
          m.text === 'Use the list-databases tool to list all databases'
      );
    });

    // Wait for the tool call approval UI to appear (the "Run" button inside the chat)
    const chatMessages = browser.$(Selectors.AssistantChatMessages);
    const cancelButton = chatMessages.$('button=Cancel');
    await cancelButton.waitForDisplayed({ timeout: 30_000 });

    // Deny the tool call
    await browser.clickVisible(cancelButton);

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

import { expect } from 'chai';

import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { startMockAtlasServiceServer } from '../helpers/atlas-service';
import { startMockAssistantServer } from '../helpers/assistant-service';
import type { MockAssistantResponse } from '../helpers/assistant-service';

describe('MongoDB Assistant', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  let mockAtlasServer: Awaited<ReturnType<typeof startMockAtlasServiceServer>>;
  let mockAssistantServer: Awaited<ReturnType<typeof startMockAssistantServer>>;
  let sendMessage: (
    text: string,
    options?: {
      response?: MockAssistantResponse;
    }
  ) => Promise<void>;

  const testMessage = 'What is MongoDB?';
  const testResponse = 'MongoDB is a database.';
  const dbName = 'test';
  const collectionName = 'entryPoints';

  before(async function () {
    skipForWeb(this, 'ai assistant not yet available in compass-web');

    process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN = 'true';

    // Start a mock Atlas service for feature flag checks
    mockAtlasServer = await startMockAtlasServiceServer();

    // Start a mock Assistant server for AI chat responses
    mockAssistantServer = await startMockAssistantServer();

    // Set env vars: one for feature flag checks, one for assistant API
    process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE =
      mockAtlasServer.endpoint;
    process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE =
      mockAssistantServer.endpoint;

    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;

    sendMessage = async (
      text: string,
      {
        response = {
          status: 200,
          body: testResponse,
        },
      }: { response?: MockAssistantResponse } = {}
    ) => {
      mockAssistantServer.setResponse(response);

      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      await chatInput.waitForDisplayed();
      await chatInput.setValue(text);
      const submitButton = browser.$(Selectors.AssistantChatSubmitButton);
      await submitButton.click();
    };

    await browser.setupDefaultConnections();
    await browser.connectToDefaults();
    await browser.selectConnectionMenuItem(
      DEFAULT_CONNECTION_NAME_1,
      Selectors.CreateDatabaseButton,
      false
    );
    await browser.addDatabase(dbName, collectionName);

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      dbName,
      collectionName,
      'Aggregations'
    );
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await mockAtlasServer.stop();
    await mockAssistantServer.stop();

    delete process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN;
    delete process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE;
    delete process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE;

    await cleanup(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    mockAssistantServer.clearRequests();
    await clearChat(browser);

    await screenshotIfFailed(compass, this.currentTest);
  });

  describe('drawer visibility', function () {
    it('shows the assistant drawer button when AI features are enabled', async function () {
      await setAIFeatures(browser, true);

      // AI Features are enabled by default so the drawer button should be visible.
      const drawerButton = browser.$(Selectors.AssistantDrawerButton);
      await drawerButton.waitForDisplayed();
      expect(await drawerButton.isDisplayed()).to.be.true;
    });

    it('does not show the assistant drawer button when AI features are disabled', async function () {
      await setAIFeatures(browser, false);

      // Assistant drawer button should not be visible
      const drawerButton = browser.$(Selectors.AssistantDrawerButton);
      await drawerButton.waitForDisplayed({ reverse: true });
      expect(await drawerButton.isDisplayed()).to.be.false;

      await setAIFeatures(browser, true);
    });

    it('can close and open the assistant drawer', async function () {
      await openAssistantDrawer(browser);

      await browser.$(Selectors.AssistantDrawerCloseButton).waitForDisplayed();

      await browser.clickVisible(Selectors.AssistantDrawerCloseButton);

      await browser.$(Selectors.AssistantDrawerCloseButton).waitForDisplayed({
        reverse: true,
      });

      await browser.clickVisible(Selectors.AssistantDrawerButton);

      await browser.$(Selectors.AssistantDrawerCloseButton).waitForDisplayed();
    });
  });

  describe('before opt-in', function () {
    beforeEach(async function () {
      await setAIOptIn(browser, false);
    });

    it('does not send the message if the user declines the opt-in', async function () {
      await openAssistantDrawer(browser);

      await sendMessage(testMessage);

      // Wait for opt-in modal and decline it
      const declineLink = browser.$(Selectors.AIOptInModalDeclineLink);
      await declineLink.waitForDisplayed();
      await declineLink.click();

      // Wait for the modal to close
      const optInModal = browser.$(Selectors.AIOptInModal);
      await optInModal.waitForDisplayed({ reverse: true });

      // Verify the input was not cleared after sending
      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      expect(await chatInput.getValue()).not.to.equal(testMessage);

      // Verify the message is not displayed in the chat
      const chatMessages = browser.$(Selectors.AssistantChatMessages);
      expect(await chatMessages.getText()).to.not.include(testMessage);

      expect(mockAssistantServer.getRequests()).to.be.empty;
    });

    describe('entry points', function () {
      beforeEach(async function () {
        await setAIOptIn(browser, false);
      });

      it('should display opt-in modal for connection error entry point', async function () {
        await browser.connectWithConnectionString(
          'mongodb-invalid://localhost:27017',
          { connectionStatus: 'failure' }
        );
        await useErrorViewEntryPoint(browser);

        const optInModal = browser.$(Selectors.AIOptInModal);
        await optInModal.waitForDisplayed();
        expect(await optInModal.isDisplayed()).to.be.true;

        const declineLink = browser.$(Selectors.AIOptInModalDeclineLink);
        await declineLink.waitForDisplayed();
        await declineLink.click();

        await optInModal.waitForDisplayed({ reverse: true });

        expect(await optInModal.isDisplayed()).to.be.false;

        expect(await getDisplayedMessages(browser)).to.deep.equal([]);
      });

      it('should display opt-in modal for explain plan entry point', async function () {
        await useExplainPlanEntryPoint(browser);

        const optInModal = browser.$(Selectors.AIOptInModal);
        await optInModal.waitForDisplayed();
        expect(await optInModal.isDisplayed()).to.be.true;

        const declineLink = browser.$(Selectors.AIOptInModalDeclineLink);
        await declineLink.waitForDisplayed();
        await declineLink.click();

        await optInModal.waitForDisplayed({ reverse: true });

        expect(await optInModal.isDisplayed()).to.be.false;

        expect(await getDisplayedMessages(browser)).to.deep.equal([]);
      });
    });

    describe('opting in', function () {
      it('sends the message if the user opts in', async function () {
        await openAssistantDrawer(browser);

        await sendMessage(testMessage);

        const optInModal = browser.$(Selectors.AIOptInModal);
        await optInModal.waitForDisplayed();
        expect(await optInModal.isDisplayed()).to.be.true;

        const acceptButton = browser.$(Selectors.AIOptInModalAcceptButton);
        await acceptButton.waitForClickable();
        await acceptButton.click();

        await optInModal.waitForDisplayed({ reverse: true });

        const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
        expect(await chatInput.getValue()).to.equal('');

        expect(await getDisplayedMessages(browser)).to.deep.equal([
          { text: testMessage, role: 'user' },
          { text: testResponse, role: 'assistant' },
        ]);
      });
    });
  });

  describe('after opt-in', function () {
    beforeEach(async function () {
      await setAIOptIn(browser, true);

      await openAssistantDrawer(browser);
    });

    describe('clear chat button', function () {
      it('appears only after a message is sent', async function () {
        const clearChatButton = browser.$(Selectors.AssistantClearChatButton);
        expect(await clearChatButton.isDisplayed()).to.be.false;
      });

      it('should clear the chat when the user clicks the clear chat button', async function () {
        await openAssistantDrawer(browser);
        await sendMessage(testMessage);
        await sendMessage(testMessage);
        expect(await getDisplayedMessages(browser)).to.deep.equal([
          { text: testMessage, role: 'user' },
          { text: testResponse, role: 'assistant' },
          { text: testMessage, role: 'user' },
          { text: testResponse, role: 'assistant' },
        ]);

        await clearChat(browser);

        expect(await getDisplayedMessages(browser)).to.deep.equal([]);
      });
    });

    it('displays multiple messages correctly', async function () {
      await sendMessage(testMessage);

      await sendMessage('This is a different message', {
        response: {
          status: 200,
          body: 'This is a different response',
        },
      });

      expect(await getDisplayedMessages(browser)).to.deep.equal([
        { text: testMessage, role: 'user' },
        { text: testResponse, role: 'assistant' },
        { text: 'This is a different message', role: 'user' },
        { text: 'This is a different response', role: 'assistant' },
      ]);
    });

    it('can copy assistant message to clipboard', async function () {
      await sendMessage(testMessage);

      await browser.pause(100);

      const messageElements = await browser
        .$$(Selectors.AssistantChatMessage)
        .getElements();

      const assistantMessage = messageElements[1];

      const copyButton = assistantMessage.$('[aria-label="Copy message"]');
      await copyButton.waitForDisplayed();
      await copyButton.click();

      await browser.pause(100);

      const clipboardText = await browser.execute(() => {
        return navigator.clipboard.readText();
      });

      expect(clipboardText).to.equal(testResponse);
    });

    it('can submit feedback with text', async function () {
      await sendMessage(testMessage);

      await browser.pause(100);

      // Get all message elements
      const messageElements = await browser
        .$$(Selectors.AssistantChatMessage)
        .getElements();

      const assistantMessage = messageElements[1];

      const thumbsDownButton = assistantMessage.$(
        '[aria-label="Dislike this message"]'
      );
      await thumbsDownButton.waitForDisplayed();
      await thumbsDownButton.click();

      const feedbackTextarea = assistantMessage.$('textarea');
      await feedbackTextarea.waitForDisplayed();

      await feedbackTextarea.setValue('This is a test feedback');

      const submitButton = browser.$('button*=Submit');
      await submitButton.waitForClickable();
      await submitButton.click();

      await feedbackTextarea.waitForDisplayed({ reverse: true });

      const thumbsDownButtonAfter = assistantMessage.$(
        '[aria-label="Dislike this message"]'
      );
      expect(await thumbsDownButtonAfter.getAttribute('aria-checked')).to.equal(
        'true'
      );
    });

    describe('entry points', function () {
      describe('explain plan entry point', function () {
        before(async function () {
          await setAIOptIn(browser, true);
          await setAIFeatures(browser, true);

          mockAssistantServer.setResponse({
            status: 200,
            body: 'You should create an index.',
          });
        });

        it('opens assistant with explain plan prompt when clicking "Interpret for me"', async function () {
          await useExplainPlanEntryPoint(browser);

          const confirmButton = browser.$('button*=Confirm');
          await confirmButton.waitForDisplayed();
          await confirmButton.click();

          await browser.pause(100);

          const messages = await getDisplayedMessages(browser);
          expect(messages).deep.equal([
            {
              text: 'Interpret this explain plan output for me.',
              role: 'user',
            },
            { text: 'You should create an index.', role: 'assistant' },
          ]);

          expect(mockAssistantServer.getRequests()).to.have.lengthOf(1);
        });

        it('does not send request when user cancels confirmation', async function () {
          await useExplainPlanEntryPoint(browser);

          const chatMessages = browser.$(Selectors.AssistantChatMessages);
          await chatMessages.waitForDisplayed();
          expect(await chatMessages.getText()).to.include(
            'Please confirm your request'
          );

          // Click Cancel button
          const cancelButton = browser.$('button*=Cancel');
          await cancelButton.waitForDisplayed();
          await cancelButton.click();

          // Wait a bit to ensure no request is sent
          await browser.pause(300);

          const finalMessages = await getDisplayedMessages(browser);
          expect(finalMessages.length).to.equal(0);

          expect(await chatMessages.getText()).to.include(
            'Please confirm your request'
          );
          expect(await chatMessages.getText()).to.include('Request cancelled');

          // Verify no assistant request was made
          expect(mockAssistantServer.getRequests()).to.be.empty;
        });
      });

      describe('error message entry point', function () {
        before(async function () {
          await setAIOptIn(browser, true);

          mockAssistantServer.setResponse({
            status: 200,
            body: 'You should review the connection string.',
          });
        });

        it('opens assistant with error message view prompt when clicking "Debug for me"', async function () {
          await browser.connectWithConnectionString(
            'mongodb-invalid://localhost:27017',
            { connectionStatus: 'failure' }
          );
          await useErrorViewEntryPoint(browser);

          const messages = await getDisplayedMessages(browser);
          expect(messages).deep.equal([
            {
              text: 'Diagnose why my Compass connection is failing and help me debug it.',
              role: 'user',
            },
            {
              text: 'You should review the connection string.',
              role: 'assistant',
            },
          ]);

          expect(mockAssistantServer.getRequests()).to.have.lengthOf(1);
        });
      });
    });
  });
});

async function setAIFeatures(browser: CompassBrowser, newValue: boolean) {
  await browser.openSettingsModal('ai');

  // Wait for AI settings content to be visible
  const aiSettingsContent = browser.$(
    Selectors.ArtificialIntelligenceSettingsContent
  );
  await aiSettingsContent.waitForDisplayed();

  const currentValue =
    (await browser
      .$(Selectors.SettingsInputElement('enableGenAIFeatures'))
      .getAttribute('aria-checked')) === 'true';

  if (currentValue !== newValue) {
    await browser.clickParent(
      Selectors.SettingsInputElement('enableGenAIFeatures')
    );
    await browser.clickVisible(Selectors.SaveSettingsButton);
  }

  const closeButton = browser.$(Selectors.CloseSettingsModalButton);
  await closeButton.waitForClickable();
  await closeButton.click();
  await closeButton.waitForDisplayed({
    reverse: true,
  });
}

async function setAIOptIn(browser: CompassBrowser, enabled: boolean) {
  // Reset the opt-in preference by using the execute command
  await browser.setFeature('optInGenAIFeatures', enabled);

  // Wait for the IPC to be processed
  await browser.pause(500);
}

async function openAssistantDrawer(browser: CompassBrowser) {
  const drawerButton = browser.$(Selectors.AssistantDrawerButton);
  await drawerButton.waitForDisplayed();
  await drawerButton.waitForClickable();
  await drawerButton.click();
}

async function clearChat(browser: CompassBrowser) {
  const clearChatButton = browser.$(Selectors.AssistantClearChatButton);
  if (await clearChatButton.isDisplayed()) {
    await clearChatButton.click();
    const confirmButton = browser.$(
      Selectors.AssistantConfirmClearChatModalConfirmButton
    );
    await confirmButton.waitForClickable();
    await confirmButton.click();
  }
}

async function getDisplayedMessages(browser: CompassBrowser) {
  // Wait for the messages container to be visible
  const chatMessages = browser.$(Selectors.AssistantChatMessages);
  await chatMessages.waitForDisplayed();

  // Get all individual message elements
  const messageElements = await browser
    .$$(Selectors.AssistantChatMessage)
    .getElements();

  const displayedMessages = [];
  for (const messageElement of messageElements) {
    const textElements = await messageElement.$$('p').getElements();
    const isAssistantMessage =
      textElements.length !== 1 &&
      (await textElements[0].getText()) === 'MongoDB Assistant';
    // Get the message text content.
    // In case of Assistant messages, skip the MongoDB Assistant text.
    const text = isAssistantMessage
      ? await textElements[1].getText()
      : await textElements[0].getText();

    displayedMessages.push({
      text: text,
      role: isAssistantMessage ? ('assistant' as const) : ('user' as const),
    });
  }

  return displayedMessages;
}

async function useExplainPlanEntryPoint(browser: CompassBrowser) {
  // Open explain plan modal by clicking the explain button
  const explainButton = browser.$(Selectors.AggregationExplainButton);
  await explainButton.waitForDisplayed();
  await explainButton.click();

  // Wait for the explain plan modal to open and finish loading
  const explainModal = browser.$(Selectors.AggregationExplainModal);
  await explainModal.waitForDisplayed();

  // Wait for the explain plan to be ready (loader should disappear)
  const explainLoader = browser.$(Selectors.ExplainLoader);
  await explainLoader.waitForDisplayed({
    reverse: true,
    timeout: 10000,
  });

  // Click the "Interpret for me" button
  const interpretButton = browser.$(Selectors.ExplainPlanInterpretButton);
  await interpretButton.waitForDisplayed();
  await interpretButton.click();

  // The modal should close
  await explainModal.waitForDisplayed({ reverse: true });

  // The assistant drawer should open
  const assistantDrawer = browser.$(Selectors.SideDrawer);
  await assistantDrawer.waitForDisplayed();
}

async function useErrorViewEntryPoint(browser: CompassBrowser) {
  const connectionToastErrorDebugButton = browser.$(
    Selectors.ConnectionToastErrorDebugButton
  );
  await connectionToastErrorDebugButton.waitForDisplayed();
  await connectionToastErrorDebugButton.click();
  await connectionToastErrorDebugButton.waitForDisplayed({
    reverse: true,
  });
}

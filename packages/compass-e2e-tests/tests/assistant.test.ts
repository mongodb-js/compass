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
  let setAIOptIn: (newValue: boolean) => Promise<void>;

  const testMessage = 'What is MongoDB?';
  const testResponse = 'MongoDB is a database.';
  const dbName = 'test';
  const collectionName = 'entryPoints';

  before(async function () {
    process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN = 'true';

    // Start a mock Atlas service for feature flag checks
    mockAtlasServer = await startMockAtlasServiceServer();

    // Start a mock Assistant server for AI chat responses
    mockAssistantServer = await startMockAssistantServer();

    process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE =
      mockAtlasServer.endpoint;
    process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE =
      mockAssistantServer.endpoint;

    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());

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

    const setup = async () => {
      browser = compass.browser;
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
    };

    setAIOptIn = async (newValue: boolean) => {
      if (
        (await browser.getFeature('optInGenAIFeatures')) === true &&
        newValue === false
      ) {
        await cleanup(compass);
        // Reseting the opt-in to false can be tricky so it's best to start over in this case.
        compass = await init(this.test?.fullTitle(), { firstRun: true });
        await setup();
        return;
      }

      await browser.setFeature('optInGenAIFeatures', newValue);
    };

    await setup();
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

      const drawerButton = browser.$(Selectors.AssistantDrawerButton);
      await drawerButton.waitForDisplayed();
      expect(await drawerButton.isDisplayed()).to.be.true;
    });

    it('does not show the assistant drawer button when AI features are disabled', async function () {
      await setAIFeatures(browser, false);

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
    before(async function () {
      await setAIOptIn(false);
    });

    it('does not send the message if the user declines the opt-in', async function () {
      await openAssistantDrawer(browser);

      await sendMessage(testMessage);

      const declineLink = browser.$(Selectors.AIOptInModalDeclineLink);
      await declineLink.waitForDisplayed();
      await declineLink.click();

      const optInModal = browser.$(Selectors.AIOptInModal);
      await optInModal.waitForDisplayed({ reverse: true });

      const chatInput = browser.$(Selectors.AssistantChatInputTextArea);
      expect(await chatInput.getValue()).not.to.equal(testMessage);

      expect(await getDisplayedMessages(browser)).to.deep.equal([]);

      expect(mockAssistantServer.getRequests()).to.be.empty;
    });

    describe('entry points', function () {
      it('should display opt-in modal for connection error entry point', async function () {
        await browser.connectWithConnectionString(
          'mongodb-invalid://localhost:27017',
          { connectionStatus: 'failure' }
        );
        await browser.clickVisible(
          browser.$(Selectors.ConnectionToastErrorDebugButton)
        );

        const optInModal = browser.$(Selectors.AIOptInModal);
        await optInModal.waitForDisplayed();
        expect(await optInModal.isDisplayed()).to.be.true;

        const declineLink = browser.$(Selectors.AIOptInModalDeclineLink);
        await declineLink.waitForDisplayed();
        await declineLink.click();

        await optInModal.waitForDisplayed({ reverse: true });

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

        expect(await getDisplayedMessages(browser)).to.deep.equal([]);
      });
    });
  });

  describe('opting in', function () {
    before(async function () {
      await setAIOptIn(false);
      await openAssistantDrawer(browser);
    });

    it('sends the message if the user opts in', async function () {
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

  describe('after opt-in', function () {
    before(async function () {
      await setAIOptIn(true);
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
      await sendMessage(testMessage, {
        response: {
          status: 200,
          body: testResponse,
        },
      });

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
      await browser.clickVisible(thumbsDownButton);

      const feedbackTextarea = assistantMessage.$('textarea');
      await feedbackTextarea.waitForDisplayed();
      await feedbackTextarea.setValue('This is a test feedback');

      await browser.clickVisible(browser.$('button*=Submit'));

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
          await setAIOptIn(true);
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
        before(function () {
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
          await browser.clickVisible(
            browser.$(Selectors.ConnectionToastErrorDebugButton)
          );

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

  await browser
    .$(Selectors.ArtificialIntelligenceSettingsContent)
    .waitForDisplayed();

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

async function openAssistantDrawer(browser: CompassBrowser) {
  await browser.clickVisible(Selectors.AssistantDrawerButton);
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
  await browser.$(Selectors.AssistantChatMessages).waitForDisplayed();

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
  await browser.clickVisible(Selectors.AggregationExplainButton);

  await browser.clickVisible(Selectors.ExplainPlanInterpretButton);

  await browser.$(Selectors.AggregationExplainModal).waitForDisplayed({
    reverse: true,
  });

  await browser.$(Selectors.AssistantChatMessages).waitForDisplayed();
}

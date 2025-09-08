import { expect } from 'chai';
import React from 'react';
import {
  screen,
  render,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import MockDataGeneratorModal from './mock-data-generator-modal';
import { MockDataGeneratorStep } from './types';
import { StepButtonLabelMap } from './constants';
import type { CollectionState } from '../../modules/collection-tab';
import { default as collectionTabReducer } from '../../modules/collection-tab';

describe('MockDataGeneratorModal', () => {
  function renderModal({
    isOpen = true,
    currentStep = MockDataGeneratorStep.SCHEMA_CONFIRMATION,
    mockServices = createMockServices(),
  } = {}) {
    const initialState: CollectionState = {
      workspaceTabId: 'test-workspace-tab-id',
      namespace: 'test.collection',
      metadata: null,
      schemaAnalysis: {
        status: 'complete',
        processedSchema: {
          name: {
            type: 'String',
            probability: 1.0,
            sample_values: ['John', 'Jane'],
          },
        },
        sampleDocument: { name: 'John' },
        schemaMetadata: { maxNestingDepth: 1, validationRules: null },
      },
      fakerSchemaGeneration: {
        status: 'idle',
      },
      mockDataGenerator: {
        isModalOpen: isOpen,
        currentStep: currentStep,
      },
    };

    const store = createStore(
      collectionTabReducer,
      initialState,
      applyMiddleware(thunk.withExtraArgument(mockServices))
    );

    return render(
      <Provider store={store}>
        <MockDataGeneratorModal />
      </Provider>
    );
  }

  function createMockServices() {
    return {
      dataService: {},
      atlasAiService: {
        getMockDataSchema: () => {
          return Promise.resolve({
            contents: {
              fields: [],
            },
          });
        },
      },
      workspaces: {},
      localAppRegistry: {},
      experimentationServices: {},
      connectionInfoRef: { current: {} },
      logger: {
        log: {
          warn: () => {},
          error: () => {},
        },
        debug: () => {},
        mongoLogId: () => 'mock-id',
      },
      preferences: { getPreferences: () => ({}) },
      fakerSchemaGenerationAbortControllerRef: { current: undefined },
    };
  }

  describe('generally', () => {
    it('renders the modal when isOpen is true', () => {
      renderModal();

      expect(screen.getByTestId('generate-mock-data-modal')).to.exist;
    });

    it('does not render the modal when isOpen is false', () => {
      renderModal({ isOpen: false });

      expect(screen.queryByTestId('generate-mock-data-modal')).to.not.exist;
    });

    it('closes the modal when the close button is clicked', async () => {
      renderModal();

      expect(screen.getByTestId('generate-mock-data-modal')).to.exist;
      userEvent.click(screen.getByLabelText('Close modal'));
      await waitFor(
        () =>
          expect(screen.queryByTestId('generate-mock-data-modal')).to.not.exist
      );
    });

    it('closes the modal when the cancel button is clicked', async () => {
      renderModal();

      expect(screen.getByTestId('generate-mock-data-modal')).to.exist;
      userEvent.click(screen.getByText('Cancel'));
      await waitFor(
        () =>
          expect(screen.queryByTestId('generate-mock-data-modal')).to.not.exist
      );
    });

    function createMockServicesWithSlowAiRequest() {
      let abortSignalReceived = false;
      let rejectPromise: (reason?: any) => void;
      const rejectedPromise = new Promise((_resolve, reject) => {
        rejectPromise = reject;
      });

      const baseMockServices = createMockServices();

      const mockAiService = {
        ...baseMockServices.atlasAiService,
        getMockDataSchema: (request: any) => {
          if (request?.signal) {
            request.signal.addEventListener('abort', () => {
              abortSignalReceived = true;
              rejectPromise(new Error('Request aborted'));
            });
          }
          return rejectedPromise;
        },
        getAbortSignalReceived: () => abortSignalReceived,
      };

      return {
        ...baseMockServices,
        atlasAiService: mockAiService,
      };
    }

    it('cancels in-flight faker mapping requests when the cancel button is clicked', async () => {
      const mockServices = createMockServicesWithSlowAiRequest();
      renderModal({ mockServices: mockServices as any });

      expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
      userEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });

      userEvent.click(screen.getByText('Cancel'));

      expect(mockServices.atlasAiService.getAbortSignalReceived()).to.be.true;
    });

    it('cancels in-flight faker mapping requests when the back button is clicked after schema confirmation', async () => {
      const mockServices = createMockServicesWithSlowAiRequest();
      renderModal({ mockServices: mockServices as any });

      expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
      userEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });

      userEvent.click(screen.getByText('Back'));

      expect(mockServices.atlasAiService.getAbortSignalReceived()).to.be.true;
    });
  });

  describe('on the schema confirmation step', () => {
    it('disables the Back button', () => {
      renderModal();

      expect(
        screen
          .getByRole('button', { name: 'Back' })
          .getAttribute('aria-disabled')
      ).to.equal('true');
    });

    it('renders the faker schema editor when the confirm button is clicked', async () => {
      renderModal();

      expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
      expect(screen.queryByTestId('faker-schema-editor')).to.not.exist;
      userEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.queryByTestId('raw-schema-confirmation')).to.not.exist;
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });
    });

    it('stays on the current step when an error is encountered during faker schema generation', async () => {
      const mockServices = createMockServices();
      mockServices.atlasAiService.getMockDataSchema = () =>
        Promise.reject('faker schema generation failed');
      renderModal({ mockServices });

      expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
      expect(screen.queryByTestId('faker-schema-editor')).to.not.exist;
      userEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
        expect(screen.queryByTestId('faker-schema-editor')).to.not.exist;
      });

      expect(screen.getByText('LLM Request failed. Please confirm again.')).to
        .exist;
    });

    // todo: assert that closing then re-opening the modal after an LLM err removes the err message
  });

  describe('when rendering the modal in a specific step', () => {
    const steps = Object.keys(
      StepButtonLabelMap
    ) as unknown as MockDataGeneratorStep[];

    // note: these tests can be removed after every modal step is implemented
    steps.forEach((currentStep) => {
      it(`renders the button with the correct label when the user is in step "${currentStep}"`, () => {
        renderModal({ currentStep });
        expect(screen.getByTestId('next-step-button')).to.have.text(
          StepButtonLabelMap[currentStep]
        );
      });
    });
  });
});

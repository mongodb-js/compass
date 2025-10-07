import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import {
  screen,
  renderWithActiveConnection,
  waitFor,
  userEvent,
  waitForElementToBeRemoved,
} from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import MockDataGeneratorModal from './mock-data-generator-modal';
import { MockDataGeneratorStep } from './types';
import { StepButtonLabelMap } from './constants';
import type { CollectionState } from '../../modules/collection-tab';
import { default as collectionTabReducer } from '../../modules/collection-tab';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';
import type { SchemaAnalysisState } from '../../schema-analysis-types';
import * as scriptGenerationUtils from './script-generation-utils';

const defaultSchemaAnalysisState: SchemaAnalysisState = {
  status: 'complete',
  processedSchema: {
    name: {
      type: 'String',
      probability: 1.0,
      sample_values: ['John', 'Jane'],
    },
  },
  arrayLengthMap: {},
  sampleDocument: { name: 'John' },
  schemaMetadata: {
    maxNestingDepth: 1,
    validationRules: null,
    avgDocumentSize: undefined,
  },
};

describe('MockDataGeneratorModal', () => {
  async function renderModal({
    isOpen = true,
    currentStep = MockDataGeneratorStep.SCHEMA_CONFIRMATION,
    enableGenAISampleDocumentPassing = false,
    mockServices = createMockServices(),
    schemaAnalysis = defaultSchemaAnalysisState,
    fakerSchemaGeneration = { status: 'idle' },
    connectionInfo,
  }: {
    isOpen?: boolean;
    enableGenAISampleDocumentPassing?: boolean;
    currentStep?: MockDataGeneratorStep;
    mockServices?: any;
    connectionInfo?: ConnectionInfo;
    schemaAnalysis?: SchemaAnalysisState;
    fakerSchemaGeneration?: CollectionState['fakerSchemaGeneration'];
  } = {}) {
    const initialState: CollectionState = {
      workspaceTabId: 'test-workspace-tab-id',
      namespace: 'test.collection',
      metadata: null,
      schemaAnalysis,
      fakerSchemaGeneration,
      mockDataGenerator: {
        isModalOpen: isOpen,
        currentStep: currentStep,
      },
    };

    const store = createStore(
      collectionTabReducer,
      initialState as any,
      applyMiddleware(thunk.withExtraArgument(mockServices))
    );

    return await renderWithActiveConnection(
      <Provider store={store}>
        <MockDataGeneratorModal />
      </Provider>,
      connectionInfo,
      {
        preferences: {
          enableGenAISampleDocumentPassing,
        },
      }
    );
  }

  function createMockServices() {
    return {
      dataService: {},
      atlasAiService: {
        getMockDataSchema: () => {
          return Promise.resolve({
            fields: [
              {
                fieldPath: 'name',
                mongoType: 'String',
                fakerMethod: 'person.firstName',
                fakerArgs: [],
              },
            ],
          } as MockDataSchemaResponse);
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
    it('renders the modal when isOpen is true', async () => {
      await renderModal();

      expect(screen.getByTestId('generate-mock-data-modal')).to.exist;
    });

    it('does not render the modal when isOpen is false', async () => {
      await renderModal({ isOpen: false });

      expect(screen.queryByTestId('generate-mock-data-modal')).to.not.exist;
    });

    it('closes the modal when the close button is clicked', async () => {
      await renderModal();

      expect(screen.getByTestId('generate-mock-data-modal')).to.exist;
      userEvent.click(screen.getByLabelText('Close modal'));
      await waitFor(
        () =>
          expect(screen.queryByTestId('generate-mock-data-modal')).to.not.exist
      );
    });

    it('closes the modal when the cancel button is clicked', async () => {
      await renderModal();

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
      await renderModal({ mockServices: mockServices as any });

      expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
      userEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor-loader')).to.exist;
      });

      userEvent.click(screen.getByText('Cancel'));

      expect(mockServices.atlasAiService.getAbortSignalReceived()).to.be.true;
    });

    it('cancels in-flight faker mapping requests when the back button is clicked after schema confirmation', async () => {
      const mockServices = createMockServicesWithSlowAiRequest();
      await renderModal({ mockServices: mockServices as any });

      expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
      userEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor-loader')).to.exist;
      });

      userEvent.click(screen.getByText('Back'));

      expect(mockServices.atlasAiService.getAbortSignalReceived()).to.be.true;
    });
  });

  describe('on the schema confirmation step', () => {
    it('disables the Back button', async () => {
      await renderModal();

      expect(
        screen
          .getByRole('button', { name: 'Back' })
          .getAttribute('aria-disabled')
      ).to.equal('true');
    });

    it('displays the namespace', async () => {
      await renderModal();
      expect(screen.getByText('test.collection')).to.exist;
    });

    it('uses the appropriate copy when Generative AI sample document passing is enabled', async () => {
      await renderModal({ enableGenAISampleDocumentPassing: true });
      expect(screen.getByText('Sample Documents Collected')).to.exist;
      expect(
        screen.getByText(
          'A sample of documents from your collection will be sent to an LLM for processing.'
        )
      ).to.exist;
      // fragment from { "name": "John" }
      expect(screen.getByText('"John"')).to.exist;
      expect(screen.queryByText('"String"')).to.not.exist;
    });

    it('uses the appropriate copy when Generative AI sample document passing is disabled', async () => {
      await renderModal();
      expect(screen.getByText('Document Schema Identified')).to.exist;
      expect(
        screen.queryByText(
          'We have identified the following schema from your documents. This schema will be sent to an LLM for processing.'
        )
      ).to.exist;
      // fragment from { "name": "String" }
      expect(screen.getByText('"String"')).to.exist;
      expect(screen.queryByText('"John"')).to.not.exist;
    });

    it('renders the faker schema editor when the confirm button is clicked', async () => {
      await renderModal();

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
      await renderModal({ mockServices });

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
  });

  describe('on the schema editor step', () => {
    const mockSchemaAnalysis: SchemaAnalysisState = {
      ...defaultSchemaAnalysisState,
      processedSchema: {
        name: {
          type: 'String',
          probability: 1.0,
        },
        age: {
          type: 'Int32',
          probability: 1.0,
        },
        email: {
          type: 'String',
          probability: 1.0,
        },
        username: {
          type: 'String',
          probability: 1.0,
        },
      },
      sampleDocument: {
        name: 'Jane',
        age: 99,
        email: 'Jane@email.com',
        username: 'JaneDoe123',
      },
    };
    const mockServicesWithMockDataResponse = createMockServices();
    mockServicesWithMockDataResponse.atlasAiService.getMockDataSchema = () =>
      Promise.resolve({
        fields: [
          {
            fieldPath: 'name',
            mongoType: 'String',
            fakerMethod: 'person.firstName',
            fakerArgs: [],
          },
          {
            fieldPath: 'age',
            mongoType: 'Int32',
            fakerMethod: 'number.int',
            fakerArgs: [],
          },
          {
            fieldPath: 'email',
            mongoType: 'String',
            fakerMethod: 'internet',
            fakerArgs: [],
          },
          {
            fieldPath: 'username',
            mongoType: 'String',
            fakerMethod: 'noSuchMethod',
            fakerArgs: [],
          },
        ],
      });

    it('shows a loading spinner when the faker schema generation is in progress', async () => {
      const mockServices = createMockServices();
      mockServices.atlasAiService.getMockDataSchema = () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                fields: [],
              }),
            1
          )
        );

      await renderModal({ mockServices });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));
      expect(screen.getByTestId('faker-schema-editor-loader')).to.exist;
    });

    it('shows the faker schema editor when the faker schema generation is completed', async () => {
      await renderModal({
        mockServices: mockServicesWithMockDataResponse,
        schemaAnalysis: mockSchemaAnalysis,
      });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));

      expect(await screen.findByTestId('faker-schema-editor')).to.exist;
      expect(screen.getByText('name')).to.exist;
      expect(screen.getByText('age')).to.exist;
    });

    it('shows correct values for the faker schema editor', async () => {
      await renderModal({
        mockServices: mockServicesWithMockDataResponse,
        schemaAnalysis: mockSchemaAnalysis,
      });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });
      // the "name" field should be selected by default
      expect(screen.getByText('name')).to.exist;
      expect(screen.getByLabelText('JSON Type')).to.have.value('String');
      expect(screen.getByLabelText('Faker Function')).to.have.value(
        'person.firstName'
      );
      // select the "age" field
      userEvent.click(screen.getByText('age'));
      expect(screen.getByText('age')).to.exist;
      expect(screen.getByLabelText('JSON Type')).to.have.value('Int32');
      expect(screen.getByLabelText('Faker Function')).to.have.value(
        'number.int'
      );
      // select the "email" field
      userEvent.click(screen.getByText('email'));
      expect(screen.getByText('email')).to.exist;
      expect(screen.getByLabelText('JSON Type')).to.have.value('String');
      // the "email" field should have a warning banner since the faker method is invalid
      expect(screen.getByLabelText('Faker Function')).to.have.value(
        'Unrecognized'
      );
      expect(
        screen.getByText(
          'Please select a function or we will default fill this field with the string "Unrecognized"'
        )
      ).to.exist;

      // select the "username" field
      userEvent.click(screen.getByText('username'));
      expect(screen.getByText('username')).to.exist;
      expect(screen.getByLabelText('JSON Type')).to.have.value('String');
      expect(screen.getByLabelText('Faker Function')).to.have.value(
        'Unrecognized'
      );
    });

    it('does not show any fields that are not in the input schema', async () => {
      const mockServices = createMockServices();
      mockServices.atlasAiService.getMockDataSchema = () =>
        Promise.resolve({
          fields: [
            {
              fieldPath: 'name',
              mongoType: 'String',
              fakerMethod: 'person.firstName',
              fakerArgs: [],
              isArray: false,
              probability: 1.0,
            },
            {
              fieldPath: 'email',
              mongoType: 'String',
              fakerMethod: 'internet.email',
              fakerArgs: [],
              isArray: false,
              probability: 1.0,
            },
          ],
        });
      await renderModal({
        mockServices,
      });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });

      expect(screen.getByText('name')).to.exist;
      expect(screen.queryByText('email')).to.not.exist;
    });

    it('shows unmapped fields as "Unrecognized"', async () => {
      const mockServices = createMockServices();
      mockServices.atlasAiService.getMockDataSchema = () =>
        Promise.resolve({
          fields: [
            {
              fieldPath: 'name',
              mongoType: 'String',
              fakerMethod: 'person.firstName',
              fakerArgs: [],
              isArray: false,
              probability: 1.0,
            },
            {
              fieldPath: 'age',
              mongoType: 'Int32',
              fakerMethod: 'number.int',
              fakerArgs: [],
              isArray: false,
              probability: 1.0,
            },
          ],
        });

      await renderModal({
        mockServices,
        schemaAnalysis: {
          ...defaultSchemaAnalysisState,
          processedSchema: {
            name: {
              type: 'String',
              probability: 1.0,
            },
            age: {
              type: 'Int32',
              probability: 1.0,
            },
            type: {
              type: 'String',
              probability: 1.0,
              sample_values: ['cat', 'dog'],
            },
          },
          sampleDocument: { name: 'Peaches', age: 10, type: 'cat' },
        },
      });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));
      await waitForElementToBeRemoved(() =>
        screen.queryByTestId('faker-schema-editor-loader')
      );

      // select the "name" field
      userEvent.click(screen.getByText('name'));
      expect(screen.getByLabelText('JSON Type')).to.have.value('String');
      expect(screen.getByLabelText('Faker Function')).to.have.value(
        'person.firstName'
      );

      // select the "age" field
      userEvent.click(screen.getByText('age'));
      expect(screen.getByLabelText('JSON Type')).to.have.value('Int32');
      expect(screen.getByLabelText('Faker Function')).to.have.value(
        'number.int'
      );

      // select the "type" field
      userEvent.click(screen.getByText('type'));
      expect(screen.getByLabelText('JSON Type')).to.have.value('String');
      expect(screen.getByLabelText('Faker Function')).to.have.value(
        'Unrecognized'
      );
    });

    it('displays preview of the faker call without args when the args are invalid', async () => {
      const largeLengthArgs = Array.from({ length: 11 }, () => 'testArg');
      const mockServices = createMockServices();
      mockServices.atlasAiService.getMockDataSchema = () =>
        Promise.resolve({
          fields: [
            {
              fieldPath: 'name',
              mongoType: 'String',
              fakerMethod: 'person.firstName',
              fakerArgs: largeLengthArgs,
              isArray: false,
              probability: 1.0,
            },
            {
              fieldPath: 'age',
              mongoType: 'Int32',
              fakerMethod: 'number.int',
              fakerArgs: [
                {
                  json: JSON.stringify({
                    a: largeLengthArgs,
                  }),
                },
              ],
              isArray: false,
              probability: 1.0,
            },
            {
              fieldPath: 'username',
              mongoType: 'String',
              fakerMethod: 'string.alpha',
              // large string
              fakerArgs: ['a'.repeat(1001)],
              isArray: false,
              probability: 1.0,
            },
            {
              fieldPath: 'avatar',
              mongoType: 'String',
              fakerMethod: 'image.url',
              fakerArgs: [
                {
                  json: JSON.stringify({
                    width: 100_000,
                    height: 100_000,
                  }),
                },
              ],
              isArray: false,
              probability: 1.0,
            },
          ],
        });

      await renderModal({
        mockServices,
        schemaAnalysis: {
          ...defaultSchemaAnalysisState,
          processedSchema: {
            name: {
              type: 'String',
              probability: 1.0,
            },
            age: {
              type: 'Int32',
              probability: 1.0,
            },
            username: {
              type: 'String',
              probability: 1.0,
            },
            avatar: {
              type: 'String',
              probability: 1.0,
            },
          },
        },
      });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });

      userEvent.click(screen.getByText('name'));
      expect(screen.getByTestId('faker-function-call-preview')).to.exist;
      expect(screen.queryByText(/testArg/)).to.not.exist;

      userEvent.click(screen.getByText('age'));
      expect(screen.getByTestId('faker-function-call-preview')).to.exist;
      expect(screen.queryByText(/testArg/)).to.not.exist;

      userEvent.click(screen.getByText('username'));
      expect(screen.queryByText(/aaaaaaa/)).to.not.exist;
      expect(screen.getByTestId('faker-function-call-preview')).to.exist;

      userEvent.click(screen.getByText('avatar'));
      expect(screen.getByTestId('faker-function-call-preview')).to.exist;
      expect(screen.queryByText(/width/)).to.not.exist;
      expect(screen.queryByText(/height/)).to.not.exist;
      expect(screen.queryByText(/100000/)).to.not.exist;
    });

    it('disables the Next button when the faker schema mapping is not confirmed', async () => {
      await renderModal({
        mockServices: mockServicesWithMockDataResponse,
      });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });

      expect(
        screen.getByTestId('next-step-button').getAttribute('aria-disabled')
      ).to.equal('true');
    });

    it('resets the confirm schema mapping state when the user clicks the back button then goes back to the schema editor step', async () => {
      await renderModal({
        mockServices: mockServicesWithMockDataResponse,
      });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });
      expect(
        screen.getByTestId('next-step-button').getAttribute('aria-disabled')
      ).to.equal('true');
      // click confirm mappings button
      userEvent.click(screen.getByText('Confirm mappings'));
      expect(
        screen.getByTestId('next-step-button').getAttribute('aria-disabled')
      ).to.equal('false');

      // click back button
      userEvent.click(screen.getByText('Back'));
      await waitFor(() => {
        expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
      });

      // click next button to advance to the schema editor step again
      userEvent.click(screen.getByTestId('next-step-button'));
      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });
      // the next button should be disabled again
      expect(
        screen.getByTestId('next-step-button').getAttribute('aria-disabled')
      ).to.equal('true');
    });

    it('preserves the confirm schema mapping state when the user clicks the next button then goes back to the schema editor step', async () => {
      await renderModal({
        mockServices: mockServicesWithMockDataResponse,
      });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });
      expect(
        screen.getByTestId('next-step-button').getAttribute('aria-disabled')
      ).to.equal('true');
      // click confirm mappings button
      userEvent.click(screen.getByText('Confirm mappings'));
      expect(
        screen.getByTestId('next-step-button').getAttribute('aria-disabled')
      ).to.equal('false');

      // click next button
      userEvent.click(screen.getByTestId('next-step-button'));
      await waitFor(() => {
        expect(screen.queryByTestId('faker-schema-editor')).to.not.exist;
      });

      // click back button to go back to the schema editor step
      userEvent.click(screen.getByText('Back'));
      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });
      // the next button should not be disabled
      expect(
        screen.getByTestId('next-step-button').getAttribute('aria-disabled')
      ).to.equal('false');
    });
  });

  describe('on the document count step', () => {
    it('displays the correct step title and description', async () => {
      await renderModal({ currentStep: MockDataGeneratorStep.DOCUMENT_COUNT });

      expect(screen.getByText('Specify Number of Documents to Generate')).to
        .exist;

      expect(
        screen.getByText(
          /Indicate the amount of documents you want to generate below./
        )
      ).to.exist;
      expect(screen.getByText(/Note: We have defaulted to 1000./)).to.exist;
    });

    it('displays the default document count when the user does not enter a document count', async () => {
      await renderModal({ currentStep: MockDataGeneratorStep.DOCUMENT_COUNT });

      expect(
        screen.getByLabelText('Documents to generate in current collection')
      ).to.have.value('1000');
    });

    it('disables the Next button and shows an error message when the document count is greater than 100000', async () => {
      await renderModal({ currentStep: MockDataGeneratorStep.DOCUMENT_COUNT });

      userEvent.type(
        screen.getByLabelText('Documents to generate in current collection'),
        '100001'
      );

      expect(screen.getByText('Document count must be between 1 and 100000')).to
        .exist;
      expect(
        screen.getByTestId('next-step-button').getAttribute('aria-disabled')
      ).to.equal('true');
    });

    it('displays "Not available" when the avgDocumentSize is undefined', async () => {
      await renderModal({
        currentStep: MockDataGeneratorStep.DOCUMENT_COUNT,
        schemaAnalysis: {
          ...defaultSchemaAnalysisState,
          schemaMetadata: {
            ...defaultSchemaAnalysisState.schemaMetadata,
            avgDocumentSize: undefined,
          },
        },
      });

      expect(screen.getByText('Estimated Disk Size')).to.exist;
      expect(screen.getByText('Not available')).to.exist;
    });

    it('displays the correct estimated disk size when a valid document count is entered', async () => {
      await renderModal({
        currentStep: MockDataGeneratorStep.DOCUMENT_COUNT,
        schemaAnalysis: {
          ...defaultSchemaAnalysisState,
          schemaMetadata: {
            ...defaultSchemaAnalysisState.schemaMetadata,
            avgDocumentSize: 100, // 100 bytes
          },
        },
      });

      expect(screen.getByText('Estimated Disk Size')).to.exist;
      const documentCountInput = screen.getByLabelText(
        'Documents to generate in current collection'
      );
      userEvent.clear(documentCountInput);
      userEvent.type(documentCountInput, '1000');
      expect(screen.getByText('100.0KB')).to.exist;
      userEvent.clear(documentCountInput);
      userEvent.type(documentCountInput, '2000');
      expect(screen.getByText('200.0KB')).to.exist;
    });
  });

  describe('on the generate data step', () => {
    it('enables the Back button', async () => {
      await renderModal({
        currentStep: MockDataGeneratorStep.GENERATE_DATA,
        fakerSchemaGeneration: {
          status: 'completed',
          fakerSchema: {
            name: {
              fakerMethod: 'person.firstName',
              fakerArgs: [],
              probability: 1.0,
              mongoType: 'String',
            },
          },
          requestId: 'test-request-id',
        },
      });

      expect(
        screen
          .getByRole('button', { name: 'Back' })
          .getAttribute('aria-disabled')
      ).to.not.equal('true');
    });

    it('renders the main sections: Prerequisites, steps, and Resources', async () => {
      await renderModal({
        currentStep: MockDataGeneratorStep.GENERATE_DATA,
        fakerSchemaGeneration: {
          status: 'completed',
          fakerSchema: {
            name: {
              fakerMethod: 'person.firstName',
              fakerArgs: [],
              probability: 1.0,
              mongoType: 'String',
            },
          },
          requestId: 'test-request-id',
        },
      });

      expect(screen.getByText('Prerequisites')).to.exist;
      expect(screen.getByText('1. Create a .js file with the following script'))
        .to.exist;
      expect(screen.getByText('2. Run the script with')).to.exist;
      expect(screen.getByText('Resources')).to.exist;
    });

    it('closes the modal when the Done button is clicked', async () => {
      await renderModal({
        currentStep: MockDataGeneratorStep.GENERATE_DATA,
        fakerSchemaGeneration: {
          status: 'completed',
          fakerSchema: {
            name: {
              fakerMethod: 'person.firstName',
              fakerArgs: [],
              probability: 1.0,
              mongoType: 'String',
            },
          },
          requestId: 'test-request-id',
        },
      });

      expect(screen.getByTestId('generate-mock-data-modal')).to.exist;
      userEvent.click(screen.getByText('Done'));
      await waitFor(
        () =>
          expect(screen.queryByTestId('generate-mock-data-modal')).to.not.exist
      );
    });

    it('renders the Database Users link with correct URL when projectId is available', async () => {
      const atlasConnectionInfo: ConnectionInfo = {
        id: 'test-atlas-connection',
        connectionOptions: { connectionString: 'mongodb://localhost:27017' },
        atlasMetadata: {
          orgId: 'test-org',
          projectId: 'test-project-123',
          clusterName: 'test-cluster',
          clusterUniqueId: 'test-cluster-unique-id',
          clusterType: 'REPLICASET' as const,
          clusterState: 'IDLE' as const,
          metricsId: 'test-metrics-id',
          metricsType: 'replicaSet' as const,
          regionalBaseUrl: null,
          instanceSize: 'M10',
          supports: {
            globalWrites: false,
            rollingIndexes: true,
          },
        },
      };

      await renderModal({
        currentStep: MockDataGeneratorStep.GENERATE_DATA,
        connectionInfo: atlasConnectionInfo,
        fakerSchemaGeneration: {
          status: 'completed',
          fakerSchema: {
            name: {
              fakerMethod: 'person.firstName',
              fakerArgs: [],
              probability: 1.0,
              mongoType: 'String',
            },
          },
          requestId: 'test-request-id',
        },
      });

      const databaseUsersLink = screen.getByRole('link', {
        name: 'Access your Database Users',
      });
      expect(databaseUsersLink.getAttribute('href')).to.equal(
        '/v2/test-project-123#/security/database/users'
      );
    });

    it('does not render the Database Users link when projectId is not available', async () => {
      const nonAtlasConnectionInfo: ConnectionInfo = {
        id: 'test-local-connection',
        connectionOptions: { connectionString: 'mongodb://localhost:27017' },
        // No atlasMetadata means no projectId
      };

      await renderModal({
        currentStep: MockDataGeneratorStep.GENERATE_DATA,
        connectionInfo: nonAtlasConnectionInfo,
      });

      expect(screen.queryByRole('link', { name: 'Access your Database Users' }))
        .to.not.exist;
    });

    it('shows error banner when script generation fails', async () => {
      // Mock the generateScript function to return an error
      const generateScriptStub = sinon.stub(
        scriptGenerationUtils,
        'generateScript'
      );
      generateScriptStub.returns({
        success: false,
        error: 'Test error: Invalid faker schema format',
      });

      try {
        await renderModal({
          currentStep: MockDataGeneratorStep.GENERATE_DATA,
          fakerSchemaGeneration: {
            status: 'completed',
            fakerSchema: {
              name: {
                fakerMethod: 'person.firstName',
                fakerArgs: [],
                probability: 1.0,
                mongoType: 'String',
              },
            },
            requestId: 'test-request-id',
          },
        });

        expect(screen.getByRole('alert')).to.exist;
        expect(screen.getByText(/Script Generation Failed:/)).to.exist;
        expect(screen.getByText(/Test error: Invalid faker schema format/)).to
          .exist;
        expect(screen.getByText(/Please go back to the start screen/)).to.exist;

        const codeBlock = screen.getByText('// Script generation failed.');
        expect(codeBlock).to.exist;
      } finally {
        generateScriptStub.restore();
      }
    });

    it('displays the script when generation succeeds', async () => {
      await renderModal({
        currentStep: MockDataGeneratorStep.GENERATE_DATA,
        fakerSchemaGeneration: {
          status: 'completed',
          fakerSchema: {
            name: {
              fakerMethod: 'person.firstName',
              fakerArgs: [],
              probability: 1.0,
              mongoType: 'String',
            },
            email: {
              fakerMethod: 'internet.email',
              fakerArgs: [],
              probability: 1.0,
              mongoType: 'String',
            },
          },
          requestId: 'test-request-id',
        },
      });

      // Check that no error banner is displayed
      expect(screen.queryByRole('alert')).to.not.exist;
      expect(screen.queryByText('Script generation failed')).to.not.exist;
      expect(screen.getByText('firstName')).to.exist; // faker method
      expect(screen.getByText('insertMany')).to.exist;
    });
  });

  describe('when rendering the modal in a specific step', () => {
    const steps = Object.keys(
      StepButtonLabelMap
    ) as unknown as MockDataGeneratorStep[];

    // note: these tests can be removed after every modal step is implemented
    steps.forEach((currentStep) => {
      it(`renders the button with the correct label when the user is in step "${currentStep}"`, async () => {
        await renderModal({ currentStep });
        expect(screen.getByTestId('next-step-button')).to.have.text(
          StepButtonLabelMap[currentStep]
        );
      });
    });
  });
});

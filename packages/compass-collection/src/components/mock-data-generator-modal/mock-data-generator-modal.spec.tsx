import { expect } from 'chai';
import React from 'react';
import {
  screen,
  renderWithActiveConnection,
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
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';
import type { SinonSandbox } from 'sinon';
import sinon from 'sinon';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { faker } = require('@faker-js/faker/locale/en');

describe('MockDataGeneratorModal', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  async function renderModal({
    isOpen = true,
    currentStep = MockDataGeneratorStep.SCHEMA_CONFIRMATION,
    enableGenAISampleDocumentPassing = false,
    mockServices = createMockServices(),
    connectionInfo,
  }: {
    isOpen?: boolean;
    enableGenAISampleDocumentPassing?: boolean;
    currentStep?: MockDataGeneratorStep;
    mockServices?: any;
    connectionInfo?: ConnectionInfo;
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
            content: {
              fields: [
                {
                  fieldPath: 'name',
                  mongoType: 'string',
                  fakerMethod: 'person.firstName',
                  fakerArgs: [],
                  isArray: false,
                  probability: 1.0,
                },
              ],
            },
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
    const mockServicesWithMockDataResponse = createMockServices();
    mockServicesWithMockDataResponse.atlasAiService.getMockDataSchema = () =>
      Promise.resolve({
        content: {
          fields: [
            {
              fieldPath: 'name',
              mongoType: 'string',
              fakerMethod: 'person.firstName',
              fakerArgs: [],
              isArray: false,
              probability: 1.0,
            },
            {
              fieldPath: 'age',
              mongoType: 'int',
              fakerMethod: 'number.int',
              fakerArgs: [],
              isArray: false,
              probability: 1.0,
            },
            {
              fieldPath: 'email',
              mongoType: 'string',
              fakerMethod: 'internet.emailAddress',
              fakerArgs: [],
              isArray: false,
              probability: 1.0,
            },
          ],
        },
      });

    it('shows a loading spinner when the faker schema generation is in progress', async () => {
      const mockServices = createMockServices();
      mockServices.atlasAiService.getMockDataSchema = () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                content: {
                  fields: [],
                },
              }),
            1000
          )
        );

      await renderModal();

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));
      expect(screen.getByTestId('faker-schema-editor-loader')).to.exist;
    });

    it('shows the faker schema editor when the faker schema generation is completed', async () => {
      await renderModal({ mockServices: mockServicesWithMockDataResponse });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));

      expect(await screen.findByTestId('faker-schema-editor')).to.exist;
      expect(screen.getByText('name')).to.exist;
      expect(screen.getByText('age')).to.exist;
    });

    it('shows correct values for the faker schema editor', async () => {
      sandbox.stub(faker, 'person').returns('Jane');
      sandbox.stub(faker, 'number').returns(30);
      sandbox.stub(faker, 'internet').throws(new Error('Invalid faker method'));
      await renderModal({ mockServices: mockServicesWithMockDataResponse });

      // advance to the schema editor step
      userEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.getByTestId('faker-schema-editor')).to.exist;
      });
      // the "name" field should be selected by default
      expect(screen.getByText('name')).to.exist;
      expect(screen.getByLabelText('JSON Type')).to.have.value('string');
      expect(screen.getByLabelText('Faker Function')).to.have.value(
        'person.firstName'
      );
      // select the "age" field
      userEvent.click(screen.getByText('age'));
      expect(screen.getByText('age')).to.exist;
      expect(screen.getByLabelText('JSON Type')).to.have.value('int');
      expect(screen.getByLabelText('Faker Function')).to.have.value(
        'number.int'
      );
      // select the "email" field
      userEvent.click(screen.getByText('email'));
      expect(screen.getByText('email')).to.exist;
      expect(screen.getByLabelText('JSON Type')).to.have.value('string');
      // the "email" field should have a warning banner since the faker method is invalid
      expect(screen.getByLabelText('Faker Function')).to.have.value(
        'Unrecognized'
      );
      expect(
        screen.getByText(
          'Please select a function or we will default fill this field with the string "Unrecognized"'
        )
      ).to.exist;
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
  });

  describe('on the generate data step', () => {
    it('enables the Back button', async () => {
      await renderModal({ currentStep: MockDataGeneratorStep.GENERATE_DATA });

      expect(
        screen
          .getByRole('button', { name: 'Back' })
          .getAttribute('aria-disabled')
      ).to.not.equal('true');
    });

    it('renders the main sections: Prerequisites, steps, and Resources', async () => {
      await renderModal({ currentStep: MockDataGeneratorStep.GENERATE_DATA });

      expect(screen.getByText('Prerequisites')).to.exist;
      expect(screen.getByText('1. Create a .js file with the following script'))
        .to.exist;
      expect(screen.getByText('2. Run the script with')).to.exist;
      expect(screen.getByText('Resources')).to.exist;
    });

    it('closes the modal when the Done button is clicked', async () => {
      await renderModal({ currentStep: MockDataGeneratorStep.GENERATE_DATA });

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

    // todo: assert that the generated script is displayed in the code block (CLOUDP-333860)
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

import { expect } from 'chai';
import sinon from 'sinon';
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
import type { FakerSchema, MockDataGeneratorStep } from './types';
import { DataGenerationSteps, MockDataGeneratorSteps } from './types';
import {
  DEFAULT_CONNECTION_STRING_FALLBACK,
  StepButtonLabelMap,
  DEFAULT_DOCUMENT_COUNT,
} from './constants';
import type { CollectionState } from '../../modules/collection-tab';
import { default as collectionTabReducer } from '../../modules/collection-tab';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { type MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';
import type { SchemaAnalysisState } from '../../schema-analysis-types';
import * as scriptGenerationUtils from './script-generation-utils';

// Helper to create fakerSchemaGeneration in completed state
const createCompletedFakerSchema = (schema: FakerSchema) => ({
  status: 'completed' as const,
  fakerSchema: schema,
  requestId: 'test-request-id',
});

const defaultSchemaAnalysisState: SchemaAnalysisState = {
  status: 'complete',
  processedSchema: {
    name: {
      type: 'String',
      probability: 1.0,
      sampleValues: ['John', 'Jane'],
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
const mockUserConnectionString = 'mockUserConnectionString';

describe('MockDataGeneratorModal', () => {
  async function renderModal({
    isOpen = true,
    currentStep = MockDataGeneratorSteps.SCHEMA_CONFIRMATION,
    enableGenAISampleDocumentPassing = false,
    mockServices = createMockServices(),
    schemaAnalysis = defaultSchemaAnalysisState,
    fakerSchemaGeneration = { status: 'idle' },
    connectionInfo,
    documentCount = DEFAULT_DOCUMENT_COUNT.toString(),
  }: {
    isOpen?: boolean;
    enableGenAISampleDocumentPassing?: boolean;
    currentStep?: MockDataGeneratorStep;
    mockServices?: any;
    connectionInfo?: ConnectionInfo;
    schemaAnalysis?: SchemaAnalysisState;
    fakerSchemaGeneration?: CollectionState['fakerSchemaGeneration'];
    documentCount?: string;
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
        documentCount: documentCount,
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

      expect(screen.getByTestId('generate-mock-data-modal')).to.be.open;
    });

    it('does not render the modal when isOpen is false', async () => {
      await renderModal({ isOpen: false });

      expect(screen.getByTestId('generate-mock-data-modal')).to.be.closed;
    });

    it('closes the modal when the close button is clicked', async () => {
      await renderModal();

      expect(screen.getByTestId('generate-mock-data-modal')).to.be.open;
      userEvent.click(screen.getByLabelText('Close modal'));
      await waitFor(
        () =>
          expect(screen.getByTestId('generate-mock-data-modal')).to.be.closed
      );
    });

    it('fires a track event when the close button is clicked', async () => {
      const result = await renderModal();
      userEvent.click(screen.getByLabelText('Close modal'));
      await waitFor(() => {
        expect(result.track).to.have.been.calledWith(
          'Mock Data Generator Dismissed',
          {
            screen: MockDataGeneratorSteps.SCHEMA_CONFIRMATION,
            gen_ai_features_enabled: false,
            send_sample_values_enabled: false,
          }
        );
      });
    });

    it('closes the modal when the cancel button is clicked', async () => {
      await renderModal();

      expect(screen.getByTestId('generate-mock-data-modal')).to.be.open;
      userEvent.click(screen.getByText('Cancel'));
      await waitFor(
        () =>
          expect(screen.getByTestId('generate-mock-data-modal')).to.be.closed
      );
    });

    it('fires a track event when the cancel button is clicked', async () => {
      const result = await renderModal();
      userEvent.click(screen.getByText('Cancel'));
      await waitFor(() => {
        expect(result.track).to.have.been.calledWith(
          'Mock Data Generator Dismissed',
          {
            screen: MockDataGeneratorSteps.SCHEMA_CONFIRMATION,
            gen_ai_features_enabled: false,
            send_sample_values_enabled: false,
          }
        );
      });
    });

    // TODO: CLOUDP-381905 - Loading state tests
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

    it('advances to Preview and Doc Count step when the confirm button is clicked and LLM succeeds', async () => {
      await renderModal();

      expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
      expect(screen.queryByTestId('preview-and-doc-count')).to.not.exist;
      userEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.queryByTestId('raw-schema-confirmation')).to.not.exist;
        expect(screen.getByTestId('preview-and-doc-count')).to.exist;
      });
    });

    it('stays on the current step when an error is encountered during faker schema generation', async () => {
      const mockServices = createMockServices();
      mockServices.atlasAiService.getMockDataSchema = () =>
        Promise.reject('faker schema generation failed');
      await renderModal({ mockServices });

      expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
      expect(screen.queryByTestId('preview-and-doc-count')).to.not.exist;
      userEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(screen.getByTestId('raw-schema-confirmation')).to.exist;
        expect(screen.queryByTestId('preview-and-doc-count')).to.not.exist;
      });

      expect(screen.getByText('LLM Request failed. Please confirm again.')).to
        .exist;
    });
  });

  describe('on the script result step', () => {
    it('enables the Back button', async () => {
      await renderModal({
        currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
        fakerSchemaGeneration: createCompletedFakerSchema({
          name: {
            fakerMethod: 'person.firstName',
            fakerArgs: [],
            probability: 1.0,
            mongoType: 'String',
          },
        }),
      });

      expect(
        screen
          .getByRole('button', { name: 'Back' })
          .getAttribute('aria-disabled')
      ).to.not.equal('true');
    });

    it('renders the main sections: Prerequisites, steps, and Resources', async () => {
      await renderModal({
        currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
        fakerSchemaGeneration: createCompletedFakerSchema({
          name: {
            fakerMethod: 'person.firstName',
            fakerArgs: [],
            probability: 1.0,
            mongoType: 'String',
          },
        }),
      });

      expect(screen.getByText('Prerequisites')).to.exist;
      expect(screen.getByText('1. Create a .js file with the following script'))
        .to.exist;
      expect(screen.getByText('2. Run the script with')).to.exist;
      expect(screen.getByText('Resources')).to.exist;
    });

    it('closes the modal when the Done button is clicked', async () => {
      await renderModal({
        currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
        fakerSchemaGeneration: createCompletedFakerSchema({
          name: {
            fakerMethod: 'person.firstName',
            fakerArgs: [],
            probability: 1.0,
            mongoType: 'String',
          },
        }),
      });

      expect(screen.getByTestId('generate-mock-data-modal')).to.be.open;
      userEvent.click(screen.getByText('Done'));
      await waitFor(
        () =>
          expect(screen.getByTestId('generate-mock-data-modal')).to.be.closed
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
          userConnectionString: mockUserConnectionString,
        },
      };

      await renderModal({
        currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
        connectionInfo: atlasConnectionInfo,
        fakerSchemaGeneration: createCompletedFakerSchema({
          name: {
            fakerMethod: 'person.firstName',
            fakerArgs: [],
            probability: 1.0,
            mongoType: 'String',
          },
        }),
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
        currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
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
          currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
          fakerSchemaGeneration: createCompletedFakerSchema({
            name: {
              fakerMethod: 'person.firstName',
              fakerArgs: [],
              probability: 1.0,
              mongoType: 'String',
            },
          }),
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
        currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
        fakerSchemaGeneration: createCompletedFakerSchema({
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
        }),
      });

      // Check that no error banner is displayed
      expect(screen.queryByRole('alert')).to.not.exist;
      expect(screen.queryByText('Script generation failed')).to.not.exist;
      expect(screen.getByText('firstName')).to.exist; // faker method
      expect(screen.getByText('insertMany')).to.exist;
    });

    it('fires a track event when the script is generated', async () => {
      const result = await renderModal({
        currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
        documentCount: '100',
        fakerSchemaGeneration: createCompletedFakerSchema({
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
        }),
      });

      await waitFor(() => {
        expect(result.track).to.have.been.calledWith(
          'Mock Data Script Generated',
          {
            field_count: 2,
            output_docs_count: 100,
          }
        );
      });
    });

    it('fires a track event when the mongosh script is copied', async () => {
      const result = await renderModal({
        currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
        fakerSchemaGeneration: createCompletedFakerSchema({
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
        }),
      });

      const codeCopyButtons = screen.getAllByTestId('lg-code-copy_button');
      const mongoshCopyButton = codeCopyButtons[1];

      expect(codeCopyButtons).to.have.length(2);
      userEvent.click(mongoshCopyButton);
      await waitFor(() => {
        expect(result.track).to.have.been.calledWith(
          'Mock Data Script Copied',
          {
            step: DataGenerationSteps.RUN_SCRIPT,
          }
        );
      });
    });

    it('shows userConnectionString in the mongosh command when available', async () => {
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
          userConnectionString: mockUserConnectionString,
        },
      };

      await renderModal({
        currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
        connectionInfo: atlasConnectionInfo,
        fakerSchemaGeneration: createCompletedFakerSchema({
          name: {
            fakerMethod: 'person.firstName',
            fakerArgs: [],
            probability: 1.0,
            mongoType: 'String',
          },
        }),
      });

      expect(screen.getByText(mockUserConnectionString, { exact: false })).to
        .exist;
    });

    it('shows fallback connection string when there is no Atlas metadata', async () => {
      const atlasConnectionInfoWithoutAtlasMetadata: ConnectionInfo = {
        id: 'test-atlas-connection',
        connectionOptions: { connectionString: 'mongodb://localhost:27017' },
      };

      await renderModal({
        currentStep: MockDataGeneratorSteps.SCRIPT_RESULT,
        connectionInfo: atlasConnectionInfoWithoutAtlasMetadata,
        fakerSchemaGeneration: createCompletedFakerSchema({
          name: {
            fakerMethod: 'person.firstName',
            fakerArgs: [],
            probability: 1.0,
            mongoType: 'String',
          },
        }),
      });

      expect(
        screen.getByText(DEFAULT_CONNECTION_STRING_FALLBACK, { exact: false })
      ).to.exist;
    });
  });

  describe('when rendering the modal in a specific step', () => {
    const steps = Object.keys(
      StepButtonLabelMap
    ) as unknown as MockDataGeneratorStep[];

    steps.forEach((currentStep) => {
      it(`renders the button with the correct label when the user is in step "${currentStep}"`, async () => {
        await renderModal({ currentStep });
        expect(screen.getByTestId('next-step-button')).to.have.text(
          StepButtonLabelMap[currentStep]
        );
      });

      it('fires a track event when the user is viewing a mock data generator step', async () => {
        const result = await renderModal({ currentStep });
        expect(result.track).to.have.been.calledWith(
          'Mock Data Generator Screen Viewed',
          {
            screen: currentStep,
          }
        );
      });

      it('does not fire a track event when the modal is closed', async () => {
        const result = await renderModal({ currentStep, isOpen: false });
        expect(result.track).to.not.have.been.calledWith(
          'Mock Data Generator Screen Viewed',
          {
            screen: currentStep,
          }
        );
      });
    });
  });
});

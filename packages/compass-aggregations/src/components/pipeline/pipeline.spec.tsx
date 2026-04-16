import React from 'react';
import { expect } from 'chai';
import {
  cleanup,
  createPluginTestHelpers,
} from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import Pipeline from './pipeline';
import type { PipelineProps } from './pipeline';
import { CompassAggregationsPlugin } from '../../index';
import { mockDataService } from '../../../test/mocks/data-service';

class MockAtlasAiService {
  async getAggregationFromUserInput() {
    return Promise.resolve({});
  }
  async getQueryFromUserInput() {
    return Promise.resolve({});
  }
  async ensureAiFeatureAccess() {
    return Promise.resolve();
  }
}

const { renderWithActiveConnection } = createPluginTestHelpers(
  CompassAggregationsPlugin.provider.withMockServices({
    atlasAiService: new MockAtlasAiService(),
    collection: {
      fetchMetadata: () => ({}),
      toJSON: () => ({}),
      on: () => {},
      removeListener: () => {},
    } as any,
  } as any),
  {
    namespace: 'test.test',
    isReadonly: false,
    isTimeSeries: false,
    isClustered: false,
    isFLE: false,
    isSearchIndexesSupported: false,
    isDataLake: false,
    isAtlas: false,
    serverVersion: '4.0.0',
  }
);

const createMockPipelineProps = (
  overrides: Partial<PipelineProps> = {}
): PipelineProps => ({
  saveCurrentPipeline: sinon.stub(),
  savingPipelineNameChanged: sinon.stub(),
  savingPipelineApply: sinon.stub(),
  savingPipelineCancel: sinon.stub(),
  clonePipeline: sinon.stub(),
  showRunButton: true,
  showExplainButton: true,
  toggleSettingsIsExpanded: sinon.stub(),
  toggleSettingsIsCommentMode: sinon.stub(),
  setSettingsSampleSize: sinon.stub(),
  setSettingsLimit: sinon.stub(),
  isCommenting: false,
  applySettings: sinon.stub(),
  settings: {
    isExpanded: false,
    isCommentMode: true,
    isDirty: false,
    sampleSize: 20,
    limit: 100000,
  },
  savingPipeline: { name: '', isOpen: false, isSaveAs: false },
  dismissViewError: sinon.stub(),
  workspace: 'builder',
  enableSearchActivationProgramP1: true,
  hasSearchStage: false,
  isReadonlyView: false,
  serverVersion: '7.0.0',
  isSearchIndexesSupported: true,
  startPollingSearchIndexes: sinon.stub(),
  stopPollingSearchIndexes: sinon.stub(),
  ...overrides,
});

const mockConnectionInfo = {
  id: 'TEST',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27020',
  },
};

describe('Pipeline search indexes polling', function () {
  let startPollingStub: sinon.SinonStub;
  let stopPollingStub: sinon.SinonStub;

  beforeEach(function () {
    startPollingStub = sinon.stub();
    stopPollingStub = sinon.stub();
  });

  afterEach(function () {
    cleanup();
    sinon.restore();
  });

  describe('when enableSearchActivationProgramP1 is false', function () {
    it('does not call any polling functions', async function () {
      await renderWithActiveConnection(
        <Pipeline
          {...createMockPipelineProps({
            enableSearchActivationProgramP1: false,
            hasSearchStage: true,
            isSearchIndexesSupported: true,
            startPollingSearchIndexes: startPollingStub,
            stopPollingSearchIndexes: stopPollingStub,
          })}
        />,
        mockConnectionInfo,
        { connectFn: () => mockDataService() }
      );

      expect(startPollingStub.called).to.equal(false);
      expect(stopPollingStub.called).to.equal(false);
    });
  });

  describe('when not a readonly view (regular collection)', function () {
    describe('when search indexes are not supported', function () {
      it('does not call startPollingSearchIndexes even when hasSearchStage is true', async function () {
        await renderWithActiveConnection(
          <Pipeline
            {...createMockPipelineProps({
              isReadonlyView: false,
              hasSearchStage: true,
              isSearchIndexesSupported: false,
              startPollingSearchIndexes: startPollingStub,
              stopPollingSearchIndexes: stopPollingStub,
            })}
          />,
          mockConnectionInfo,
          { connectFn: () => mockDataService() }
        );

        expect(startPollingStub.called).to.equal(false);
        expect(stopPollingStub.called).to.equal(false);
      });
    });

    describe('when search indexes are supported', function () {
      it('calls startPollingSearchIndexes when hasSearchStage is true', async function () {
        await renderWithActiveConnection(
          <Pipeline
            {...createMockPipelineProps({
              isReadonlyView: false,
              hasSearchStage: true,
              isSearchIndexesSupported: true,
              startPollingSearchIndexes: startPollingStub,
              stopPollingSearchIndexes: stopPollingStub,
            })}
          />,
          mockConnectionInfo,
          { connectFn: () => mockDataService() }
        );

        expect(startPollingStub.calledOnce).to.equal(true);
        expect(stopPollingStub.called).to.equal(false);
      });

      it('calls stopPollingSearchIndexes when hasSearchStage is false', async function () {
        await renderWithActiveConnection(
          <Pipeline
            {...createMockPipelineProps({
              isReadonlyView: false,
              hasSearchStage: false,
              isSearchIndexesSupported: true,
              startPollingSearchIndexes: startPollingStub,
              stopPollingSearchIndexes: stopPollingStub,
            })}
          />,
          mockConnectionInfo,
          { connectFn: () => mockDataService() }
        );

        expect(startPollingStub.called).to.equal(false);
        expect(stopPollingStub.calledOnce).to.equal(true);
      });
    });
  });

  describe('when readonly view', function () {
    // Requires server version >= 8.1.0 for view search compatibility

    describe('when server version < 8.1.0 (not compatible)', function () {
      it('does not poll when hasSearchStage is true and serverVersion is 7.0.0', async function () {
        await renderWithActiveConnection(
          <Pipeline
            {...createMockPipelineProps({
              isReadonlyView: true,
              hasSearchStage: true,
              serverVersion: '7.0.0',
              isSearchIndexesSupported: true,
              startPollingSearchIndexes: startPollingStub,
              stopPollingSearchIndexes: stopPollingStub,
            })}
          />,
          mockConnectionInfo,
          { connectFn: () => mockDataService() }
        );

        expect(startPollingStub.called).to.equal(false);
        expect(stopPollingStub.called).to.equal(false);
      });

      it('does not poll when hasSearchStage is true and serverVersion is 8.0.0', async function () {
        await renderWithActiveConnection(
          <Pipeline
            {...createMockPipelineProps({
              isReadonlyView: true,
              hasSearchStage: true,
              serverVersion: '8.0.0',
              isSearchIndexesSupported: true,
              startPollingSearchIndexes: startPollingStub,
              stopPollingSearchIndexes: stopPollingStub,
            })}
          />,
          mockConnectionInfo,
          { connectFn: () => mockDataService() }
        );

        expect(startPollingStub.called).to.equal(false);
        expect(stopPollingStub.called).to.equal(false);
      });
    });

    describe('when server version >= 8.1.0 (compatible)', function () {
      it('calls startPollingSearchIndexes when hasSearchStage is true and serverVersion is 8.1.0', async function () {
        await renderWithActiveConnection(
          <Pipeline
            {...createMockPipelineProps({
              isReadonlyView: true,
              hasSearchStage: true,
              serverVersion: '8.1.0',
              isSearchIndexesSupported: true,
              startPollingSearchIndexes: startPollingStub,
              stopPollingSearchIndexes: stopPollingStub,
            })}
          />,
          mockConnectionInfo,
          { connectFn: () => mockDataService() }
        );

        expect(startPollingStub.calledOnce).to.equal(true);
        expect(stopPollingStub.called).to.equal(false);
      });

      it('calls stopPollingSearchIndexes when hasSearchStage is false', async function () {
        await renderWithActiveConnection(
          <Pipeline
            {...createMockPipelineProps({
              isReadonlyView: true,
              hasSearchStage: false,
              serverVersion: '8.1.0',
              isSearchIndexesSupported: true,
              startPollingSearchIndexes: startPollingStub,
              stopPollingSearchIndexes: stopPollingStub,
            })}
          />,
          mockConnectionInfo,
          { connectFn: () => mockDataService() }
        );

        expect(startPollingStub.called).to.equal(false);
        expect(stopPollingStub.calledOnce).to.equal(true);
      });
    });
  });
});

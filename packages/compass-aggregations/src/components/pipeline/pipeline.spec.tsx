import React from 'react';
import { expect } from 'chai';
import { render, cleanup } from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';

import Pipeline from './pipeline';
import type { PipelineProps } from './pipeline';

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
  isSearchIndexesSupported: true,
  startPollingSearchIndexes: sinon.stub(),
  stopPollingSearchIndexes: sinon.stub(),
  ...overrides,
});

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
    it('does not call any polling functions', function () {
      render(
        <Pipeline
          {...createMockPipelineProps({
            enableSearchActivationProgramP1: false,
            hasSearchStage: true,
            isSearchIndexesSupported: true,
            startPollingSearchIndexes: startPollingStub,
            stopPollingSearchIndexes: stopPollingStub,
          })}
        />
      );

      expect(startPollingStub.called).to.equal(false);
      expect(stopPollingStub.called).to.equal(false);
    });
  });

  describe('when search indexes are not supported', function () {
    it('does not call startPollingSearchIndexes even when hasSearchStage is true', function () {
      render(
        <Pipeline
          {...createMockPipelineProps({
            hasSearchStage: true,
            isSearchIndexesSupported: false,
            startPollingSearchIndexes: startPollingStub,
            stopPollingSearchIndexes: stopPollingStub,
          })}
        />
      );

      expect(startPollingStub.called).to.equal(false);
    });
  });

  describe('when search indexes are supported', function () {
    it('calls startPollingSearchIndexes when hasSearchStage is true', function () {
      render(
        <Pipeline
          {...createMockPipelineProps({
            hasSearchStage: true,
            isSearchIndexesSupported: true,
            startPollingSearchIndexes: startPollingStub,
            stopPollingSearchIndexes: stopPollingStub,
          })}
        />
      );

      expect(startPollingStub.calledOnce).to.equal(true);
      expect(stopPollingStub.called).to.equal(false);
    });

    it('calls stopPollingSearchIndexes when hasSearchStage is false', function () {
      render(
        <Pipeline
          {...createMockPipelineProps({
            hasSearchStage: false,
            isSearchIndexesSupported: true,
            startPollingSearchIndexes: startPollingStub,
            stopPollingSearchIndexes: stopPollingStub,
          })}
        />
      );

      expect(startPollingStub.called).to.equal(false);
      expect(stopPollingStub.calledOnce).to.equal(true);
    });
  });
});

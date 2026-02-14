import React from 'react';
import { expect } from 'chai';
import { render, cleanup } from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';

import { SearchIndexesPollingController } from './search-indexes-polling-controller';

describe('SearchIndexesPollingController', function () {
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

  describe('when search indexes are not supported', function () {
    it('does not call startPollingSearchIndexes even when hasSearchStage is true', function () {
      render(
        <SearchIndexesPollingController
          hasSearchStage={true}
          isSearchIndexesSupported={false}
          startPollingSearchIndexes={startPollingStub}
          stopPollingSearchIndexes={stopPollingStub}
        />
      );

      expect(startPollingStub.called).to.equal(false);
      expect(stopPollingStub.called).to.equal(false);
    });
  });

  describe('when search indexes are supported', function () {
    it('calls startPollingSearchIndexes when hasSearchStage is true', function () {
      render(
        <SearchIndexesPollingController
          hasSearchStage={true}
          isSearchIndexesSupported={true}
          startPollingSearchIndexes={startPollingStub}
          stopPollingSearchIndexes={stopPollingStub}
        />
      );

      expect(startPollingStub.calledOnce).to.equal(true);
      expect(stopPollingStub.called).to.equal(false);
    });

    it('calls stopPollingSearchIndexes when hasSearchStage is false', function () {
      render(
        <SearchIndexesPollingController
          hasSearchStage={false}
          isSearchIndexesSupported={true}
          startPollingSearchIndexes={startPollingStub}
          stopPollingSearchIndexes={stopPollingStub}
        />
      );

      expect(startPollingStub.called).to.equal(false);
      expect(stopPollingStub.calledOnce).to.equal(true);
    });
  });
});

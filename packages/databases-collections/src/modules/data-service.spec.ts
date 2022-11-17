import { expect } from 'chai';
import type { DataService } from 'mongodb-data-service';

import reducer, {
  dataServiceConnected,
  dataServiceUpdated,
  DATA_SERVICE_CONNECTED,
  DATA_SERVICE_UPDATED,
} from './data-service';

describe('data service module', function () {
  describe('#dataServiceConnected', function () {
    it('returns the DATA_SERVICE_CONNECTED action', function () {
      expect(dataServiceConnected('test' as any, 'ds' as any)).to.deep.equal({
        type: DATA_SERVICE_CONNECTED,
        error: 'test',
        dataService: 'ds',
      });
    });
  });

  describe('#dataServiceUpdated', function () {
    it('returns the DATA_SERVICE_UPDATED action', function () {
      expect(dataServiceUpdated('ds' as any)).to.deep.equal({
        type: DATA_SERVICE_UPDATED,
        dataService: 'ds',
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not data service connected', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          error: null,
          dataService: null,
          configuredKMSProviders: [],
          currentTopologyType: 'Unknown',
        });
      });
    });

    context('when the action is data service connected', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, dataServiceConnected('err' as any, 'ds' as any))
        ).to.deep.equal({
          error: 'err',
          dataService: 'ds',
          configuredKMSProviders: [],
          currentTopologyType: 'Unknown',
        });
      });
    });

    context('when the action is data service updated', function () {
      it('returns the new state', function () {
        const ds = {
          currentTopologyType: () => 'Single',
        };
        const state1 = reducer(
          undefined,
          dataServiceConnected('err' as any, ds as DataService)
        );
        expect(state1.currentTopologyType).to.equal('Single');

        ds.currentTopologyType = () => 'ReplicaSetWithPrimary';
        const state2 = reducer(state1, dataServiceUpdated(ds as any));
        expect(state2).to.deep.equal({
          error: 'err',
          dataService: ds,
          configuredKMSProviders: [],
          currentTopologyType: 'ReplicaSetWithPrimary',
        });

        // Ensure that updates for another dataService instance are not
        // actually being reflected
        expect(
          reducer(state2, dataServiceUpdated({} as DataService))
        ).to.deep.equal({
          error: 'err',
          dataService: ds,
          configuredKMSProviders: [],
          currentTopologyType: 'ReplicaSetWithPrimary',
        });
      });
    });
  });
});

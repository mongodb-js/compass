import { expect } from 'chai';
import reducer, {
  dataServiceConnected,
  dataServiceUpdated,
  DATA_SERVICE_CONNECTED,
  DATA_SERVICE_UPDATED
} from './data-service';

describe('data service module', () => {
  describe('#dataServiceConnected', () => {
    it('returns the DATA_SERVICE_CONNECTED action', () => {
      expect(dataServiceConnected('test', 'ds')).to.deep.equal({
        type: DATA_SERVICE_CONNECTED,
        error: 'test',
        dataService: 'ds'
      });
    });
  });

  describe('#dataServiceUpdated', () => {
    it('returns the DATA_SERVICE_UPDATED action', () => {
      expect(dataServiceUpdated('ds')).to.deep.equal({
        type: DATA_SERVICE_UPDATED,
        dataService: 'ds'
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not data service connected', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          error: null,
          dataService: null,
          configuredKMSProviders: [],
          currentTopologyType: 'Unknown'
        });
      });
    });

    context('when the action is data service connected', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, dataServiceConnected('err', 'ds'))).to.deep.equal({
          error: 'err',
          dataService: 'ds',
          configuredKMSProviders: [],
          currentTopologyType: 'Unknown'
        });
      });
    });

    context('when the action is data service updated', () => {
      it('returns the new state', () => {
        const ds = {
          currentTopologyType: () => 'Single'
        };
        const state1 = reducer(undefined, dataServiceConnected('err', ds));
        expect(state1.currentTopologyType).to.equal('Single');

        ds.currentTopologyType = () => 'ReplicaSetWithPrimary';
        const state2 = reducer(state1, dataServiceUpdated(ds));
        expect(state2).to.deep.equal({
          error: 'err',
          dataService: ds,
          configuredKMSProviders: [],
          currentTopologyType: 'ReplicaSetWithPrimary'
        });

        // Ensure that updates for another dataService instance are not
        // actually being reflected
        expect(reducer(state2, dataServiceUpdated({}))).to.deep.equal({
          error: 'err',
          dataService: ds,
          configuredKMSProviders: [],
          currentTopologyType: 'ReplicaSetWithPrimary'
        });
      });
    });
  });
});

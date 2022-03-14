import reducer, * as actions from './data-service';
import { expect } from 'chai';

describe('data-service [module]', function () {
  describe('#reducer', function () {
    context('when the action type is DATA_SERVICE_CONNECTED', function () {
      const action = actions.dataServiceConnected('error', 'data-service');

      it('returns the new state', function () {
        expect(reducer('', action).dataService).to.equal('data-service');
      });
    });

    context('when the action type is not DATA_SERVICE_CONNECTED', function () {
      it('returns the initial state', function () {
        expect(reducer(null, {})).to.equal(null);
      });
    });
  });

  describe('#dataServiceConnected', function () {
    it('returns the action', function () {
      expect(
        actions.dataServiceConnected('error', 'data-service')
      ).to.deep.equal({
        type: actions.DATA_SERVICE_CONNECTED,
        error: 'error',
        dataService: 'data-service',
      });
    });
  });
});

import { expect } from 'chai';

import reducer, {
  dataServiceConnected,
  DATA_SERVICE_CONNECTED,
} from './data-service';

describe('data service module', function () {
  describe('#dataServiceConnected', function () {
    it('returns the DATA_SERVICE_CONNECTED action', function () {
      expect(dataServiceConnected(null, {})).to.deep.equal({
        type: DATA_SERVICE_CONNECTED,
        error: null,
        dataService: {},
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not data service connected', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          error: null,
          dataService: null,
        });
      });
    });

    context('when the action is data service connected', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, dataServiceConnected(null, {}))
        ).to.deep.equal({
          error: null,
          dataService: {},
        });
      });
    });
  });
});

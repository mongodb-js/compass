import { expect } from 'chai';

import reducer, {
  dataServiceConnected,
  DATA_SERVICE_CONNECTED,
} from './data-service';

describe('data service module', function () {
  describe('#dataServiceConnected', function () {
    it('returns the DATA_SERVICE_CONNECTED action', function () {
      expect(dataServiceConnected('ds')).to.deep.equal({
        type: DATA_SERVICE_CONNECTED,
        dataService: 'ds',
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not data service connected', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal(null);
      });
    });

    context('when the action is data service connected', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, dataServiceConnected('ds'))).to.deep.equal(
          'ds'
        );
      });
    });
  });
});

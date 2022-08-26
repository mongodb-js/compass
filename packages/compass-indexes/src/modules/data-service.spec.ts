import { expect } from 'chai';
import type { DataService } from 'mongodb-data-service';

import reducer, {
  dataServiceConnected,
  ActionTypes as DataServiceActions,
} from './data-service';

const mockDataService = new (class {
  indexes() {}
})() as any as DataService;

describe('data service module', function () {
  describe('#dataServiceConnected', function () {
    it('returns the connected action', function () {
      expect(dataServiceConnected(mockDataService)).to.deep.equal({
        type: DataServiceActions.DataServiceConnected,
        dataService: mockDataService,
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not data service connected', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' } as any)).to.deep.equal(null);
      });
    });

    context('when the action is data service connected', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, dataServiceConnected(mockDataService))
        ).to.deep.equal(mockDataService);
      });
    });
  });
});

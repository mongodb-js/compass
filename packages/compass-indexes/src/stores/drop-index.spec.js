import { expect } from 'chai';

import configureStore from './drop-index';

describe('DropIndexStore [Store]', function () {
  let store;

  context('when the data service is connected', function () {
    const ds = { 'data-service': 1 };
    beforeEach(function () {
      store = configureStore({
        dataProvider: {
          dataProvider: ds,
          error: null,
        },
      });
    });

    it('dispatches the data service connected action', function () {
      expect(store.getState().dataService).to.deep.equal({ 'data-service': 1 });
    });
  });

  context('when the data service errors', function () {
    beforeEach(function () {
      store = configureStore({
        dataProvider: {
          dataProvider: null,
          error: { message: 'err' },
        },
      });
    });
    it('dispatches the data service connected action', function () {
      expect(store.getState().error).to.equal('err');
    });
  });
});

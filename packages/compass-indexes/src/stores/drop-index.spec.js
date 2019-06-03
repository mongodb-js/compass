import configureStore from 'stores/drop-index';

describe('DropIndexStore [Store]', () => {
  let store;

  context('when the data service is connected', () => {
    const ds = {'data-service': 1};
    beforeEach(() => {
      store = configureStore({
        dataProvider: {
          dataProvider: ds,
          error: null
        }
      });
    });

    it('dispatches the data service connected action', () => {
      expect(store.getState().dataService).to.deep.equal({'data-service': 1});
    });
  });

  context('when the data service errors', () => {
    beforeEach(() => {
      store = configureStore({
        dataProvider: {
          dataProvider: null,
          error: { message: 'err' }
        }
      });
    });
    it('dispatches the data service connected action', () => {
      expect(store.getState().error).to.equal('err');
    });
  });
});

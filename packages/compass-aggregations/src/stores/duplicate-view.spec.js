import AppRegistry from 'hadron-app-registry';
import store from 'stores/duplicate-view';

describe('DuplicateViewStore [Store]', () => {
  const appRegistry = new AppRegistry();

  before(() => {
    store.onActivated(appRegistry);
  });

  describe('#onActivated', () => {
    context('when the data-service-connected event is emitted', () => {
      beforeEach(() => {
        appRegistry.emit('data-service-connected', null, 'testing');
      });

      it('dispatches the data service connected action', () => {
        expect(store.getState().dataService.dataService).to.equal('testing');
      });
    });

    context('when open create view is emitted', () => {
      beforeEach(() => {
        appRegistry.emit(
          'open-create-view',
          {
            source: 'dataService.test',
            pipeline: [{ $project: { a: 1 }}],
            duplicate: true
          }
        );
      });

      it('dispatches the toggle action', () => {
        expect(store.getState().isVisible).to.equal(true);
      });

      it('sets the pipeline', () => {
        expect(store.getState().pipeline).to.deep.equal([
          { $project: { a: 1 } }
        ]);
      });

      it('sets the source', () => {
        expect(store.getState().source).to.equal('dataService.test');
      });
    });
  });
});

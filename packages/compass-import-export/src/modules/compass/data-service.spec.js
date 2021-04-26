import reducer, * as actions from './data-service';

describe('data-service [module]', () => {
  describe('#reducer', () => {
    context('when the action type is DATA_SERVICE_CONNECTED', () => {
      const action = actions.dataServiceConnected('error', 'data-service');

      it('returns the new state', () => {
        expect(reducer('', action).dataService).to.equal('data-service');
      });
    });

    context('when the action type is not DATA_SERVICE_CONNECTED', () => {
      it('returns the initial state', () => {
        expect(reducer(null, {})).to.equal(null);
      });
    });
  });

  describe('#dataServiceConnected', () => {
    it('returns the action', () => {
      expect(actions.dataServiceConnected('error', 'data-service')).to.deep.equal({
        type: actions.DATA_SERVICE_CONNECTED,
        error: 'error',
        dataService: 'data-service'
      });
    });
  });
});

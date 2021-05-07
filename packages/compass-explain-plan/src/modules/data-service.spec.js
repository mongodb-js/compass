import reducer, {
  dataServiceConnected,
  DATA_SERVICE_CONNECTED
} from 'modules/data-service';

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

  describe('#reducer', () => {
    context('when the action is not data service connected', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          error: null,
          dataService: null
        });
      });
    });

    context('when the action is data service connected', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, dataServiceConnected('err', 'ds'))).to.deep.equal({
          error: 'err',
          dataService: 'ds'
        });
      });
    });
  });
});

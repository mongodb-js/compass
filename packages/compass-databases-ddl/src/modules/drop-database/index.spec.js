import reducer, { reset, RESET } from 'modules/drop-database';

describe('drop database module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is reset', () => {
        const dataService = 'data-service';

        it('returns the reset state', () => {
          expect(reducer({ dataService: dataService }, reset())).to.deep.equal({
            name: '',
            nameConfirmation: '',
            dataService: 'data-service'
          });
        });
      });
    });
  });

  describe('#reset', () => {
    it('returns the reset action', () => {
      expect(reset()).to.deep.equal({ type: RESET });
    });
  });

  describe('#dropDatabase', () => {
    context('when an error exists in the state', () => {

    });

    context('when no error exists in the state', () => {
      context('when the drop is a success', () => {

      });

      context('when the drop errors', () => {

      });
    });
  });
});

import reducer, { reset, RESET } from 'modules/create-database';

describe('create database module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is reset', () => {
        const dataService = 'data-service';

        it('returns the reset state', () => {
          expect(reducer({ dataService: dataService }, reset())).to.deep.equal({
            cappedSize: '',
            collation: {},
            collectionName: '',
            dataService: 'data-service',
            error: null,
            isCapped: false,
            isCustomCollation: false,
            isRunning: false,
            isVisible: false,
            name: ''
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

  describe('#createDatabase', () => {
    context('when an error exists in the state', () => {

    });

    context('when no error exists in the state', () => {
      context('when the database name is invalid', () => {

      });

      context('when the database name is valid', () => {
        context('when the collection contains no special options', () => {
          context('when the create is a success', () => {

          });

          context('when the create errors', () => {

          });
        });

        context('when the collection is capped', () => {
          context('when the create is a success', () => {

          });

          context('when the create errors', () => {

          });
        });

        context('when the collection has a collation', () => {
          context('when the create is a success', () => {

          });

          context('when the create errors', () => {

          });
        });
      });
    });
  });
});

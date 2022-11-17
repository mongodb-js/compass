import { expect } from 'chai';
import reducer from './drop-collection';
import { reset } from '../reset';

describe('drop collection module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      context('when the action is reset', function () {
        const dataService = 'data-service';

        it('returns the reset state', function () {
          expect(reducer({ dataService: dataService }, reset())).to.deep.equal({
            isRunning: false,
            isVisible: false,
            databaseName: '',
            name: '',
            error: null,
            dataService: 'data-service',
          });
        });
      });
    });
  });

  describe('#dropCollection', function () {
    context('when an error exists in the state', function () {});

    context('when no error exists in the state', function () {
      context('when the drop is a success', function () {});

      context('when the drop errors', function () {});
    });
  });
});

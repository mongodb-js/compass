import { expect } from 'chai';
import reducer from './drop-database';
import { reset } from '../reset';

describe('drop database module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      context('when the action is reset', function () {
        const dataService = 'data-service';

        it('returns the reset state', function () {
          expect(reducer({ dataService: dataService }, reset())).to.deep.equal({
            isRunning: false,
            isVisible: false,
            name: '',
            error: null,
            dataService: 'data-service',
          });
        });
      });
    });
  });

  describe('#dropDatabase', function () {
    context('when an error exists in the state', function () {});

    context('when no error exists in the state', function () {
      context('when the drop is a success', function () {});

      context('when the drop errors', function () {});
    });
  });
});

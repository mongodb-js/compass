import reducer from 'modules/drop-collection';
import { reset } from 'modules/reset';

describe('drop collection module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is reset', () => {
        const dataService = 'data-service';

        it('returns the reset state', () => {
          expect(reducer({ dataService: dataService }, reset())).to.deep.equal({
            isRunning: false,
            isVisible: false,
            name: '',
            nameConfirmation: '',
            error: null,
            dataService: 'data-service'
          });
        });
      });
    });
  });

  describe('#dropCollection', () => {
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

import Store from 'stores';
import Actions from 'actions';

describe('LicenseStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  it('defaults to hidden', () => {
    expect(Store.state.isVisible).to.equal(false);
  });

  it('defaults agreed to false', () => {
    expect(Store.state.isAgreed).to.equal(false);
  });

  describe('#show', () => {
    it('sets the state to visible', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isVisible).to.equal(true);
        done();
      });
      Actions.show();
    });
  });

  describe('#hide', () => {
    beforeEach(() => {
      Store.state.isVisible = true;
    });

    it('sets the state to not visible', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isVisible).to.equal(false);
        done();
      });
      Actions.hide();
    });
  });
});

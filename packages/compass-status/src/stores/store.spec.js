import Store from 'stores';

describe('StatusStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  describe('#getInitialState', () => {
    it('defaults visible to false', () => {
      expect(Store.state.visible).to.equal(false);
    });

    it('defaults progressbar to false', () => {
      expect(Store.state.progressbar).to.equal(false);
    });

    it('defaults progress to 0', () => {
      expect(Store.state.progress).to.equal(0);
    });

    it('defaults modal to false', () => {
      expect(Store.state.modal).to.equal(false);
    });

    it('defaults animation to false', () => {
      expect(Store.state.animation).to.equal(false);
    });

    it('defaults message to empty', () => {
      expect(Store.state.message).to.equal('');
    });

    it('defaults subview to null', () => {
      expect(Store.state.subview).to.equal(null);
    });

    it('defaults sidebar to false', () => {
      expect(Store.state.sidebar).to.equal(false);
    });

    it('defaults trickle to false', () => {
      expect(Store.state.trickle).to.equal(false);
    });
  });
});

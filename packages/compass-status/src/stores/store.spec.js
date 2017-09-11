import Store from 'stores';
import Actions from 'actions';

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

  describe('#showProgressBar', () => {
    it('sets visible and progressbar to true', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.visible).to.equal(true);
        expect(state.progressbar).to.equal(true);
        done();
      });
      Actions.showProgressBar();
    });
  });

  describe('#showIndeterminateProgressBar', () => {
  });

  describe('#hideProgressBar', () => {
  });

  describe('#configure', () => {
  });

  describe('#setProgressValue', () => {
  });

  describe('#incProgressValue', () => {
  });

  describe('#enableProgressTrickle', () => {
  });

  describe('#disableProgressTrickle', () => {
  });

  describe('#setMessage', () => {
  });

  describe('#clearMessage', () => {
  });

  describe('#showAnimation', () => {
  });

  describe('#hideAnimation', () => {
  });

  describe('#showStaticSidebar', () => {
  });

  describe('#hideStaticSidebar', () => {
  });

  describe('#setSubview', () => {
  });

  describe('#onClearSubview', () => {
  });

  describe('#enableModal', () => {
  });

  describe('#disableModal', () => {
  });

  describe('#hide', () => {
  });

  describe('#done', () => {
  });
});

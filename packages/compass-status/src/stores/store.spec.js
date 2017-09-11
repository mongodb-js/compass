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
    it('sets the 100% visible bar without trickle', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.visible).to.equal(true);
        expect(state.progressbar).to.equal(true);
        expect(state.progress).to.equal(100);
        expect(state.trickle).to.equal(false);
        done();
      });
      Actions.showIndeterminateProgressBar();
    });

    context('when the bar is trickling', () => {
      beforeEach((done) => {
        const unsubscribe = Store.listen(() => {
          unsubscribe();
          done();
        });
        Actions.enableProgressTrickle();
      });

      it('stops the trickle', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.trickle).to.equal(false);
          expect(Store._trickleTimer).to.equal(null);
          done();
        });
        Actions.showIndeterminateProgressBar();
      });
    });
  });

  describe('#hideProgressBar', () => {
    beforeEach(() => {
      Store.state.progressbar = true;
    });

    it('sets the progress bar to false', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.progressbar).to.equal(false);
        done();
      });
      Actions.hideProgressBar();
    });

    context('when the bar is trickling', () => {
      beforeEach((done) => {
        const unsubscribe = Store.listen(() => {
          unsubscribe();
          done();
        });
        Actions.enableProgressTrickle();
      });

      it('stops the trickle', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.trickle).to.equal(false);
          expect(Store._trickleTimer).to.equal(null);
          done();
        });
        Actions.hideProgressBar();
      });
    });
  });

  describe('#configure', () => {
    context('when trickle is falsy', () => {

    });

    context('when trickle is truthy', () => {

    });
  });

  describe('#setProgressValue', () => {
    it('sets a visible progress', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.visible).to.equal(true);
        expect(state.progress).to.equal(45);
        done();
      });
      Actions.setProgressValue(45);
    });
  });

  describe('#incProgressValue', () => {
    beforeEach(() => {
      Store.state.progress = 40;
    });

    it('increments the visible progress', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.visible).to.equal(true);
        expect(state.progress).to.equal(55);
        done();
      });
      Actions.incProgressValue(15);
    });
  });

  describe('#enableProgressTrickle', () => {
    context('when a timer already exists', () => {

    });

    context('when a timer does not exist', () => {

    });
  });

  describe('#disableProgressTrickle', () => {
    context('when a timer exists', () => {

    });

    context('when a timer does not exist', () => {

    });
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
    context('when the store is trickling', () => {

    });
  });

  describe('#done', () => {
    context('when the store is trickling', () => {

    });
  });
});

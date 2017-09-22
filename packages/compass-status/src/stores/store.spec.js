import Store from 'stores';
import Actions from 'actions';

describe('StatusStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  describe('#getInitialState', () => {
    it('sets visible to false', () => {
      expect(Store.state.visible).to.equal(false);
    });

    it('sets progressbar to false', () => {
      expect(Store.state.progressbar).to.equal(false);
    });

    it('sets progress to 0', () => {
      expect(Store.state.progress).to.equal(0);
    });

    it('sets modal to false', () => {
      expect(Store.state.modal).to.equal(false);
    });

    it('sets animation to false', () => {
      expect(Store.state.animation).to.equal(false);
    });

    it('sets message to empty', () => {
      expect(Store.state.message).to.equal('');
    });

    it('sets subview to null', () => {
      expect(Store.state.subview).to.equal(null);
    });

    it('sets sidebar to true', () => {
      expect(Store.state.sidebar).to.equal(true);
    });

    it('sets trickle to false', () => {
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
      beforeEach(() => {
        Store.state.trickle = true;
      });

      it('configures state with a disabled trickle', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.trickle).to.equal(false);
          expect(Store._trickleTimer).to.equal(null);
          const unsub = Store.listen((st) => {
            unsub();
            expect(st.progress).to.equal(50);
            expect(st.progressbar).to.equal(true);
            done();
          });
        });
        Actions.configure({ progress: 50, progressbar: true });
      });
    });

    context('when trickle is truthy', () => {
      afterEach((done) => {
        const unsubscribe = Store.listen(() => {
          unsubscribe();
          done();
        });
        Actions.disableProgressTrickle();
      });

      it('configures state with an enabled trickle', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.trickle).to.equal(true);
          expect(Store._trickleTimer).to.not.equal(null);
          const unsub = Store.listen((st) => {
            unsub();
            expect(st.progress).to.equal(50);
            done();
          });
        });
        Actions.configure({ progress: 50, trickle: true });
      });
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

  describe('#setMessage', () => {
    it('sets a visible message', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.visible).to.equal(true);
        expect(state.message).to.equal('message');
        done();
      });
      Actions.setMessage('message');
    });
  });

  describe('#clearMessage', () => {
    beforeEach(() => {
      Store.state.message = 'testing';
    });

    it('clears the message', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.message).to.equal('');
        done();
      });
      Actions.clearMessage();
    });
  });

  describe('#showAnimation', () => {
    it('sets a visible animation', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.visible).to.equal(true);
        expect(state.animation).to.equal(true);
        done();
      });
      Actions.showAnimation();
    });
  });

  describe('#hideAnimation', () => {
    beforeEach(() => {
      Store.state.animation = true;
    });

    it('hides the animation', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.animation).to.equal(false);
        done();
      });
      Actions.hideAnimation();
    });
  });

  describe('#showStaticSidebar', () => {
    it('sets a visible sidebar', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.visible).to.equal(true);
        expect(state.sidebar).to.equal(true);
        done();
      });
      Actions.showStaticSidebar();
    });
  });

  describe('#hideStaticSidebar', () => {
    beforeEach(() => {
      Store.state.sidebar = true;
    });

    it('hides the sidebar', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.sidebar).to.equal(false);
        done();
      });
      Actions.hideStaticSidebar();
    });
  });

  describe('#setSubview', () => {
    it('sets the subview', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.subview).to.equal('div');
        done();
      });
      Actions.setSubview('div');
    });
  });

  describe('#onClearSubview', () => {
    beforeEach(() => {
      Store.state.subview = 'div';
    });

    it('clears the subview', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.subview).to.equal(null);
        done();
      });
      Store.onClearSubview();
    });
  });

  describe('#enableModal', () => {
    it('sets modal to true', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.modal).to.equal(true);
        done();
      });
      Actions.enableModal();
    });
  });

  describe('#disableModal', () => {
    beforeEach(() => {
      Store.state.modal = true;
    });

    it('sets modal to false', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.modal).to.equal(false);
        done();
      });
      Actions.disableModal();
    });
  });

  describe('#hide', () => {
    context('when the store is trickling', () => {
      beforeEach((done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          state.visible = true;
          done();
        });
        Actions.enableProgressTrickle();
      });

      it('stops the trickle', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.trickle).to.equal(false);
          expect(Store._trickleTimer).to.equal(null);
          const unsub = Store.listen((st) => {
            unsub();
            expect(st.visible).to.equal(false);
            done();
          });
        });
        Actions.hide();
      });
    });
  });

  describe('#done', () => {
    context('when the store is trickling', () => {
      beforeEach((done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          state.visible = true;
          state.progress = 50;
          state.animation = true;
          state.message = 'testing';
          state.subview = 'div';
          done();
        });
        Actions.enableProgressTrickle();
      });

      it('stops the trickle', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.trickle).to.equal(false);
          expect(Store._trickleTimer).to.equal(null);
          const unsub = Store.listen((st) => {
            unsub();
            expect(st.progress).to.equal(100);
            expect(st.animation).to.equal(false);
            expect(st.message).to.equal('');
            expect(st.subview).to.equal(null);
            done();
          });
        });
        Actions.done();
      });
    });
  });
});

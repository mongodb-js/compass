import React from 'react';
import Store from 'stores';
import Actions from 'actions';
import AppRegistry from 'hadron-app-registry';

describe('StatusStore [Store]', () => {
  const appRegistry = new AppRegistry();
  const SubView = () => {
    return (<div></div>);
  };

  before(() => {
    Store.onActivated(appRegistry);
  });

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

    context('when triggered from the app registry', () => {
      it('sets visible and progressbar to true', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.visible).to.equal(true);
          expect(state.progressbar).to.equal(true);
          done();
        });
        appRegistry.emit('compass:status:show-progress-bar');
      });
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
        expect(state.subview).to.equal(SubView);
        done();
      });
      Actions.setSubview(SubView);
    });
  });

  describe('#clearSubview', () => {
    beforeEach(() => {
      Store.state.subview = 'div';
    });

    it('clears the subview', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.subview).to.equal(null);
        done();
      });
      Store.clearSubview();
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

  describe('#setGlobalAppRegistry', () => {
    it('sets the app registry', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.globalAppRegistry).to.deep.equal(appRegistry);
        done();
      });
      Actions.setGlobalAppRegistry(appRegistry);
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
          state.subview = SubView;
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

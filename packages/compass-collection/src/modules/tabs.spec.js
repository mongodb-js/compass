import reducer, {
  selectNamespace,
  createTab,
  closeTab,
  selectTab,
  SELECT_NAMESPACE,
  SELECT_TAB,
  CREATE_TAB,
  CLOSE_TAB
} from 'modules/tabs';

describe('tabs module', () => {
  describe('#selectNamespace', () => {
    it('returns the SELECT_NAMESPACE action', () => {
      expect(selectNamespace('db.coll', true)).to.deep.equal({
        type: SELECT_NAMESPACE,
        namespace: 'db.coll',
        isReadonly: true
      });
    });
  });

  describe('#createTab', () => {
    it('returns the CREATE_TAB action', () => {
      expect(createTab('db.coll', true)).to.deep.equal({
        type: CREATE_TAB,
        namespace: 'db.coll',
        isReadonly: true
      });
    });
  });

  describe('#selectTab', () => {
    it('returns the SELECT_TAB action', () => {
      expect(selectTab(1)).to.deep.equal({
        type: SELECT_TAB,
        index: 1
      });
    });
  });

  describe('#closeTab', () => {
    it('returns the CLOSE_TAB action', () => {
      expect(closeTab(1)).to.deep.equal({
        type: CLOSE_TAB,
        index: 1
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not found', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal([]);
      });
    });

    context('when the action is namespace selected', () => {
      context('when no tabs exist', () => {
        let state;
        const namespace = 'db.coll';

        before(() => {
          state = reducer(undefined, selectNamespace(namespace, true));
        });

        it('creates a new tab with the namespace', () => {
          expect(state[0].namespace).to.equal(namespace);
        });

        it('sets the tab to active', () => {
          expect(state[0].isActive).to.equal(true);
        });

        it('sets the tab readonly value', () => {
          expect(state[0].isReadonly).to.equal(true);
        });

        it('does not add additional tabs', () => {
          expect(state.length).to.equal(1);
        });
      });

      context('when one tab exists', () => {
        let state;
        const namespace = 'db.coll';
        const existingState = [
          { namespace: 'db.coll1', isActive: true, isReadonly: false }
        ];

        before(() => {
          state = reducer(existingState, selectNamespace(namespace, true));
        });

        it('sets the new namespace on the tab', () => {
          expect(state[0].namespace).to.equal(namespace);
        });

        it('keeps the tab as active', () => {
          expect(state[0].isActive).to.equal(true);
        });

        it('sets the tab readonly value', () => {
          expect(state[0].isReadonly).to.equal(true);
        });

        it('does not add additional tabs', () => {
          expect(state.length).to.equal(1);
        });
      });

      context('when multiple tabs exist', () => {
        let state;
        const namespace = 'db.coll';
        const existingState = [
          { namespace: 'db.coll1', isActive: false, isReadonly: false },
          { namespace: 'db.coll2', isActive: true, isReadonly: false },
          { namespace: 'db.coll3', isActive: false, isReadonly: false }
        ];

        before(() => {
          state = reducer(existingState, selectNamespace(namespace, true));
        });

        it('sets the new namespace on the tab', () => {
          expect(state[1].namespace).to.equal(namespace);
        });

        it('keeps the tab as active', () => {
          expect(state[1].isActive).to.equal(true);
        });

        it('sets the tab readonly value', () => {
          expect(state[1].isReadonly).to.equal(true);
        });

        it('does not add additional tabs', () => {
          expect(state.length).to.equal(3);
        });
      });
    });

    context('when the action is create tab', () => {
      context('when no tabs exist', () => {
        let state;
        const namespace = 'db.coll';

        before(() => {
          state = reducer(undefined, createTab(namespace, true));
        });

        it('creates a new tab with the namespace', () => {
          expect(state[0].namespace).to.equal(namespace);
        });

        it('does not set the tab to active', () => {
          expect(state[0].isActive).to.equal(false);
        });

        it('sets the tab readonly value', () => {
          expect(state[0].isReadonly).to.equal(true);
        });

        it('adds additional tabs', () => {
          expect(state.length).to.equal(1);
        });
      });

      context('when one tab exists', () => {
        let state;
        const namespace = 'db.coll';
        const existingState = [
          { namespace: 'db.coll1', isActive: true, isReadonly: false }
        ];

        before(() => {
          state = reducer(existingState, createTab(namespace, true));
        });

        it('sets the new namespace on the new tab', () => {
          expect(state[1].namespace).to.equal(namespace);
        });

        it('does not set the new tab as active', () => {
          expect(state[1].isActive).to.equal(false);
        });

        it('sets the tab readonly value', () => {
          expect(state[1].isReadonly).to.equal(true);
        });

        it('adds additional tabs', () => {
          expect(state.length).to.equal(2);
        });
      });

      context('when multiple tabs exist', () => {
        let state;
        const namespace = 'db.coll';
        const existingState = [
          { namespace: 'db.coll1', isActive: true, isReadonly: false },
          { namespace: 'db.coll2', isActive: false, isReadonly: false }
        ];

        before(() => {
          state = reducer(existingState, createTab(namespace, true));
        });

        it('sets the new namespace on the new tab', () => {
          expect(state[2].namespace).to.equal(namespace);
        });

        it('does not set the new tab as active', () => {
          expect(state[2].isActive).to.equal(false);
        });

        it('sets the tab readonly value', () => {
          expect(state[2].isReadonly).to.equal(true);
        });

        it('adds additional tabs', () => {
          expect(state.length).to.equal(3);
        });
      });
    });

    context('when the action is select tab', () => {
      context('when one tab exists', () => {
        let state;
        const existingState = [
          { namespace: 'db.coll1', isActive: true, isReadonly: false }
        ];

        before(() => {
          state = reducer(existingState, selectTab(0));
        });

        it('does not change the active state', () => {
          expect(state[0].isActive).to.equal(true);
        });

        it('does not add additional tabs', () => {
          expect(state.length).to.equal(1);
        });
      });

      context('when multiple tabs exist', () => {
        let state;
        const existingState = [
          { namespace: 'db.coll1', isActive: true, isReadonly: false },
          { namespace: 'db.coll1', isActive: false, isReadonly: false },
          { namespace: 'db.coll1', isActive: false, isReadonly: false }
        ];

        before(() => {
          state = reducer(existingState, selectTab(1));
        });

        it('it activates the selected tab', () => {
          expect(state[1].isActive).to.equal(true);
        });

        it('deactivates the other tabs', () => {
          expect(state[0].isActive).to.equal(false);
          expect(state[2].isActive).to.equal(false);
        });

        it('does not add additional tabs', () => {
          expect(state.length).to.equal(3);
        });
      });
    });

    context('when the action is close tab', () => {
      context('when one tab exists', () => {
        let state;
        const existingState = [
          { namespace: 'db.coll1', isActive: true, isReadonly: false }
        ];

        before(() => {
          state = reducer(existingState, closeTab(0));
        });

        it('removes the tab', () => {
          expect(state.length).to.equal(0);
        });
      });

      context('when multiple tabs exist', () => {
        let state;
        const existingState = [
          { namespace: 'db.coll1', isActive: true, isReadonly: false },
          { namespace: 'db.coll1', isActive: false, isReadonly: false },
          { namespace: 'db.coll1', isActive: false, isReadonly: false }
        ];

        context('when the tab being removed is active', () => {
          before(() => {
            state = reducer(existingState, closeTab(0));
          });

          it('removes the tab', () => {
            expect(state.length).to.equal(2);
          });
        });

        context('when the tab being removed is not active', () => {
          before(() => {
            state = reducer(existingState, closeTab(1));
          });

          it('removes the tab', () => {
            expect(state.length).to.equal(2);
          });
        });
      });
    });
  });
});

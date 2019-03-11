import reducer, {
  namespaceSelected,
  NAMESPACE_SELECTED
} from 'modules/tabs';

describe('tabs module', () => {
  describe('#namespaceSelected', () => {
    it('returns the NAMESPACE_SELECTED action', () => {
      expect(namespaceSelected('db.coll', true)).to.deep.equal({
        type: NAMESPACE_SELECTED,
        namespace: 'db.coll',
        isReadonly: true
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
          state = reducer(undefined, namespaceSelected(namespace, true));
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
      });
    });
  });
});

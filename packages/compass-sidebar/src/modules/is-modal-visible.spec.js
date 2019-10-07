import reducer, {
  INITIAL_STATE,
  TOGGLE_IS_MODAL_VISIBLE,
  toggleIsModalVisible
} from 'modules/is-modal-visible';

describe('is-modal-visible module', () => {
  describe('reducer', () => {
    context('when the action is toggleIsModalVisible', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsModalVisible(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsModalVisible', () => {
    context('when it is a data lake', () => {
      it('sets true in the action', () => {
        expect(toggleIsModalVisible(true)).to.deep.equal({
          type: TOGGLE_IS_MODAL_VISIBLE,
          isModalVisible: true
        });
      });
    });

    context('when it is not a data lake', () => {
      it('sets false in the action', () => {
        expect(toggleIsModalVisible(false)).to.deep.equal({
          type: TOGGLE_IS_MODAL_VISIBLE,
          isModalVisible: false
        });
      });
    });
  });
});

import reducer, {
  INITIAL_STATE,
  changeInstanceId,
  CHANGE_INSTANCE_ID
} from 'modules/instance-id';

describe('instance-id module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeInstanceId('new instanceId'))).to.equal('new instanceId');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeInstanceId', () => {
    it('returns the action', () => {
      expect(changeInstanceId('new instanceId w action')).to.deep.equal({
        type: CHANGE_INSTANCE_ID,
        instanceId: 'new instanceId w action'
      });
    });
  });
});

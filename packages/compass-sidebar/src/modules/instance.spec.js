import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  changeInstance,
  CHANGE_INSTANCE
} from './instance';

const instance = {
  _id: '123',
};

describe('sidebar instance', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeInstance(instance))).to.deep.equal({
          _id: '123',
        });
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeInstance', () => {
    it('returns the action', () => {
      expect(changeInstance('new instance w action')).to.deep.equal({
        type: CHANGE_INSTANCE,
        instance: 'new instance w action'
      });
    });
  });
});

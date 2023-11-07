import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  changeInstance,
  CHANGE_INSTANCE,
} from './instance';

const instance: any = {
  _id: '123',
};

describe('sidebar instance', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, changeInstance(instance))).to.deep.equal({
          _id: '123',
        });
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {} as any)).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeInstance', function () {
    it('returns the action', function () {
      expect(changeInstance('new instance w action' as any)).to.deep.equal({
        type: CHANGE_INSTANCE,
        instance: 'new instance w action',
      });
    });
  });
});

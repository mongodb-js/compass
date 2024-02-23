import { getTrackingUserInfo } from './util';
import type { AtlasUserInfo } from './util';
import { expect } from 'chai';

describe('getTrackingUserInfo', function () {
  it('should return required tracking info from user info', function () {
    expect(
      getTrackingUserInfo({
        sub: '1234',
        primaryEmail: 'test@example.com',
      } as AtlasUserInfo)
    ).to.deep.eq({
      auid: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    });
  });
});

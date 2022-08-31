import { expect } from 'chai';
import icon from './icon';

describe('icon', function () {
  it('should be a non-empty nativeImage', function () {
    expect(icon.isEmpty()).to.eq(false);
  });
});

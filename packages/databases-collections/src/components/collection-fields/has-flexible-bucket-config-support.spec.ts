import { expect } from 'chai';
import hasFlexibleBucketConfigSupport from './has-flexible-bucket-config-support';

describe('hasFlexibleBucketConfigSupport', function () {
  it('returns false for < 6.3', function () {
    expect(hasFlexibleBucketConfigSupport('5.0.0')).to.be.false;
    expect(hasFlexibleBucketConfigSupport('6.0.0')).to.be.false;
  });

  it('returns true for 6.3', function () {
    expect(hasFlexibleBucketConfigSupport('6.3.0')).to.be.true;
  });

  it('returns true for >= 6.3', function () {
    expect(hasFlexibleBucketConfigSupport('6.3.0')).to.be.true;
    expect(hasFlexibleBucketConfigSupport('6.3.0-alpha0-277-g02d6940')).to.be
      .true;
    expect(hasFlexibleBucketConfigSupport('6.4.0-alpha0-277-g02d6940')).to.be
      .true;
  });

  it('returns true for invalid versions', function () {
    expect(hasFlexibleBucketConfigSupport('')).to.be.true;
    expect(hasFlexibleBucketConfigSupport('notasemver')).to.be.true;
    expect(hasFlexibleBucketConfigSupport(undefined as any)).to.be.true;
    expect(hasFlexibleBucketConfigSupport(null as any)).to.be.true;
  });
});

import { expect } from 'chai';
import { Lock } from './lock';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Lock', () => {
  it('should allow to create a lock promise that can be resolved programmatically', async() => {
    const lock = new Lock();
    const [token, wasUnlocked] = await Promise.all([
      lock.lock(),
      (async() => {
        await sleep(50);
        return lock.unlock();
      })()
    ]);
    expect(lock.isUnlockToken(token)).to.equal(true);
    expect(wasUnlocked).to.equal(true);
  });

  it('throws when trying to create locks when locked', () => {
    const lock = new Lock();

    lock.lock();

    let err: Error;

    try {
      lock.lock();
    } catch (e) {
      err = e;
    } finally {
      lock.unlock();
    }

    expect(err).to.be.instanceof(Error);
    expect(err)
      .to.have.property('message')
      .match(/Can't create another lock while locked/);
  });

  describe('unlock', () => {
    it('should return false if lock is not locked', () => {
      const lock = new Lock();
      expect(lock.unlock()).to.equal(false);
    });
  });

  describe('isLocked', () => {
    it('shoult return current lock status', () => {
      const lock = new Lock();
      expect(lock.isLocked()).to.equal(false);
      lock.lock();
      expect(lock.isLocked()).to.equal(true);
      lock.unlock();
      expect(lock.isLocked()).to.equal(false);
    });
  });
});

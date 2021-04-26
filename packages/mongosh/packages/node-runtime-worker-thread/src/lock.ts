export type UNLOCKED = 'UNLOCKED';

export class Lock {
  private static UNLOCK_TOKEN: UNLOCKED = 'UNLOCKED';

  private promise: Promise<UNLOCKED> | null = null;

  private resolve: ((...args: any[]) => any) | null = null;

  lock(): Promise<UNLOCKED> {
    if (this.isLocked()) {
      throw new Error('Can\'t create another lock while locked');
    }

    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
    return this.promise;
  }

  unlock(): boolean {
    const resolve = this.resolve;
    if (resolve) {
      this.promise = null;
      this.resolve = null;
      resolve(Lock.UNLOCK_TOKEN);
      return true;
    }
    return false;
  }

  isLocked(): boolean {
    return Boolean(this.promise);
  }

  isUnlockToken(resolvedValue: any): resolvedValue is UNLOCKED {
    return resolvedValue === Lock.UNLOCK_TOKEN;
  }
}

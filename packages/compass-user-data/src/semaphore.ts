export class Semaphore {
  private currentCount = 0;
  private queue: (() => void)[] = [];
  private maxConcurrentOps: number;
  constructor(maxConcurrentOps: number) {
    this.maxConcurrentOps = maxConcurrentOps;
  }

  waitForRelease(): Promise<() => void> {
    return new Promise((resolve) => {
      const attempt = () => {
        this.currentCount++;
        resolve(this.release.bind(this));
      };
      if (this.currentCount < this.maxConcurrentOps) {
        attempt();
      } else {
        this.queue.push(attempt);
      }
    });
  }

  private release() {
    this.currentCount--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    }
  }
}

import { expect } from 'chai';
import { Semaphore } from './semaphore';

describe('semaphore', function () {
  const maxConcurrentOps = 5;
  let semaphore: Semaphore;
  let taskHandler: (id: number) => Promise<number>;

  beforeEach(() => {
    semaphore = new Semaphore(maxConcurrentOps);
    taskHandler = async (id: number) => {
      const release = await semaphore.waitForRelease();
      const delay = Math.floor(Math.random() * 450) + 50;
      try {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return id;
      } finally {
        release();
      }
    };
  });

  it('should run operations concurrently', async function () {
    const tasks = Array.from({ length: 10 }, (_, i) => taskHandler(i));
    const results = await Promise.all(tasks);
    expect(results).to.have.lengthOf(10);
  });
});

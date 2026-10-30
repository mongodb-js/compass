import { expect } from 'chai';

import { RecordWriteQueue } from './record-write-queue';

// Lets the microtask queue drain, so a task that is not waiting for anything
// would have started by the time this resolves.
function drainMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('RecordWriteQueue', function () {
  it('should run tasks for the same record one after another', async function () {
    const queue = new RecordWriteQueue();
    const started: string[] = [];
    let finishFirst!: () => void;

    const first = queue.run('a', async () => {
      started.push('first');
      await new Promise<void>((resolve) => {
        finishFirst = resolve;
      });
    });
    const second = queue.run('a', () => {
      started.push('second');
      return Promise.resolve();
    });

    await drainMicrotasks();
    expect(started).to.deep.equal(['first']);

    finishFirst();
    await Promise.all([first, second]);
    expect(started).to.deep.equal(['first', 'second']);
  });

  it('should not make tasks for different records wait for each other', async function () {
    const queue = new RecordWriteQueue();
    const started: string[] = [];
    let finishFirst!: () => void;

    const first = queue.run('a', async () => {
      started.push('first');
      await new Promise<void>((resolve) => {
        finishFirst = resolve;
      });
    });
    const second = queue.run('b', () => {
      started.push('second');
      return Promise.resolve();
    });

    await drainMicrotasks();
    expect(started).to.deep.equal(['first', 'second']);

    finishFirst();
    await Promise.all([first, second]);
  });

  it('should return what the task returns and reject with what it throws', async function () {
    const queue = new RecordWriteQueue();

    expect(await queue.run('a', () => Promise.resolve('saved'))).to.equal(
      'saved'
    );
    expect(
      await queue
        .run('a', () => Promise.reject(new Error('nope')))
        .catch((err) => err)
    ).to.have.property('message', 'nope');
  });

  it('should run the next task for the same record after one fails', async function () {
    const queue = new RecordWriteQueue();
    const started: string[] = [];

    const failing = queue.run('a', () => {
      started.push('failing');
      return Promise.reject(new Error('nope'));
    });
    const next = queue.run('a', () => {
      started.push('next');
      return Promise.resolve();
    });

    await failing.catch(() => undefined);
    await next;

    expect(started).to.deep.equal(['failing', 'next']);
  });

  it('should forget a record once its saves are done', async function () {
    // The queue outlives every save, so an entry that is never cleared would
    // grow with every record ever saved.
    const queue = new RecordWriteQueue();
    const pendingRecords = (queue as unknown as { tails: Map<string, unknown> })
      .tails;

    await queue.run('a', () => Promise.resolve());
    expect(pendingRecords.size).to.equal(0);

    await Promise.all([
      queue.run('a', () => Promise.resolve()),
      queue.run('b', () => Promise.resolve()),
    ]);
    expect(pendingRecords.size).to.equal(0);
  });
});

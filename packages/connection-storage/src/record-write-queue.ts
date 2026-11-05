/**
 * Runs read-merge-write sequences for the same record one after another.
 *
 * write-file-atomic makes each individual write atomic, but it does not order
 * writes: two saves for one record would both read the record as it was before
 * either of them, and the second write would drop the first one's change.
 * Saves for different records do not wait for each other.
 */
export class RecordWriteQueue {
  private readonly tails = new Map<string, Promise<void>>();

  run<T>(id: string, task: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(id) ?? Promise.resolve();
    const result = previous.then(task);
    // The tail never rejects, so a failed save does not stop the next one for
    // the same record, and it is not an unhandled rejection either.
    const tail = result.then(
      () => undefined,
      () => undefined
    );
    this.tails.set(id, tail);
    return result.finally(() => {
      // Only the last queued save clears the entry, so the map does not grow
      // with the number of records ever saved.
      if (this.tails.get(id) === tail) {
        this.tails.delete(id);
      }
    });
  }
}

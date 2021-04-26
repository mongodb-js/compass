// Note: Codes are shared with the old async rewriter for now, hence starting at 10012

/**
 * @mongoshErrors
 */
enum AsyncRewriterErrors {
  /**
   * Signals the use of a Mongosh API call in a place where it is not supported.
   * This occurs inside of constructors and (non-async) generator functions.
   *
   * Examples causing error:
   * ```
   * class SomeClass {
   *   constructor() {
   *     this.list = db.coll.find().toArray();
   *   }
   * }
   *
   * function*() {
   *   yield* db.coll.find().toArray();
   * }
   * ```
   *
   * **Solution: Do not use calls directly in such functions. If necessary, place these calls in an inner 'async' function.**
   */
  SyntheticPromiseInAlwaysSyncContext = 'ASYNC-10012'
}

export {
  AsyncRewriterErrors
};

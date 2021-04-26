/**
 * A completion item
 */
export interface Completion {

  /**
   * The completed text (ie. db.coll1.f -> db.coll1.find).
   */
  completion: string;
}

/**
 * Interface for an Autocompleter
 */
export interface Autocompleter {

  /**
   * Returns completions for the code passed as argument.
   *
   * @param {string} code - the code to complete.
   * @returns {Completion[]} an array of completions.
   */
  getCompletions(code: string): Promise<Completion[]>;
}

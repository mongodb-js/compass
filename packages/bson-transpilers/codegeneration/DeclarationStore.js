/**
 * Stores declarations for the driver syntax
 *
 * @returns {object}
 */
class DeclarationStore {
  constructor() {
    this.store = [];
  }

  /**
   * Add declaration statements by a pre-incremented variable root-name
   *
   * @param {string} varRoot - The root of the variable name to be appended by the occurance count
   * @param {function} declaration - The code block to be prepended to the driver syntax
   * @returns {string} the variable name with root and appended count
   */
  add(varRoot, declaration) {
    const varName = this.next(varRoot);
    const data = {varName: varName, declaration: declaration(varName) };
    this.store.push(data);
    return data.varName;
  }

  /**
   * Get the next variable name given a pre-incremented variable root-name
   *
   * @param {string} varRoot - The root of the variable name to be appended by the occurance count
   * @returns {string} the variable name with root and appended count
   */
  next(varRoot) {
    const existing = this.store.filter(h => h.varName.startsWith(varRoot));

    // If the data does not exist in the store, then the count should append nothing to the variable
    // name
    const count = existing.length > 0 ? existing.length : '';
    return `${varRoot}${count}`;
  }

  /**
   * Stringify the variable declarations
   *
   * @param {string} sep - seperator string placed between elements in the resulting string of declarations
   * @returns {string} all the declarations as a string seperated by a line-break
   */
  toString(sep = '\n\n') {
    return this.store.map((value) => value.declaration).join(sep);
  }
}

module.exports = DeclarationStore;

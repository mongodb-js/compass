/**
 * Stores declarations for the driver syntax
 *
 * @returns {object}
 */
class DeclarationStore {
  constructor() {
    this.store = {};
  }

  /**
   * Add declaration statements by a pre-incremented variable root-name
   *
   * @param {string} template - Name/alias of the template needing the declaration
   * @param {string} varRoot - The root of the variable name to be appended by the occurance count
   * @param {function} declaration - The code block to be prepended to the driver syntax
   * @returns {string} the variable name with root and appended count
   */
  add(template, varRoot, declaration) {
    // Don't push existing declarations
    const current = this.alreadyDeclared(template, varRoot, declaration);
    if (current !== undefined) {
      return current;
    }
    const varName = this.next(template, varRoot);
    this.store[declaration(varName)] = varName;
    return varName;
  }

  /**
   * Check if the template + varRoot + declaration combo already exists
   *
   * @param {string} template - Name/alias of the template needing the declaration
   * @param {string} varRoot - The root of the variable name to be appended by the occurance count
   * @param {function} declaration - The code block to be prepended to the driver syntax
   * @returns {string | undefined} The current variable name with root associated with the declaration, if it exists
   */
  alreadyDeclared(template, varRoot, declaration) {
    const existing = this.candidates(template, varRoot);
    for (var i = 0; i < existing.length; i++) {
      const mock = `${this.varTemplateRoot(template, varRoot)}${i > 0 ? i : ''}`;
      const current = this.store[declaration(mock)];
      if (current !== undefined) {
        return current;
      }
    }
  }

  candidates(template, varRoot) {
    const varTemplateRoot = this.varTemplateRoot(template, varRoot);
    return Object.values(this.store).filter(varName => varName.startsWith(varTemplateRoot));
  }

  length() {
    return Object.keys(this.store).length;
  }

  /**
   * Get the next variable name given a pre-incremented variable root-name
   *
   * @param {string} template - Name/alias of the template needing the declaration
   * @param {string} varRoot - The root of the variable name to be appended by the occurance count
   * @returns {string} The variable name with root and appended count
   */
  next(template, varRoot) {
    const existing = this.candidates(template, varRoot);

    // If the data does not exist in the store, then the count should append nothing to the variable
    // name
    const count = existing.length > 0 ? existing.length : '';
    return `${this.varTemplateRoot(template, varRoot)}${count}`;
  }

  /**
   * Stringify the variable declarations
   *
   * @param {string} sep - Seperator string placed between elements in the resulting string of declarations
   * @returns {string} All the declarations as a string seperated by a line-break
   */
  toString(sep = '\n\n') {
    return Object.keys(this.store).join(sep);
  }

  varTemplateRoot(template, varRoot) {
    return `${varRoot}For${template}`;
  }
}

module.exports = DeclarationStore;

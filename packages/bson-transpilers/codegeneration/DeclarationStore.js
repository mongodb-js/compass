/**
 * Stores declarations for use in the DriverTemplate
 *
 * @returns {object}
 */
class DeclarationStore {
  constructor() {
    this.store = {};
  }

  /**
   * Add declarations by templateID + varRoot + declaration combo.  Duplications will not be collected, rather the add
   * method will return the existing declaration's variable name.
   *
   * @param {string} templateID - Name/alias of the template the declaration is being made for
   * @param {string} varRoot - The root of the variable name to be appended by the occurance count
   * @param {function} declaration - The code block to be prepended to the driver syntax
   * @returns {string} the variable name with root and appended count
   */
  add(templateID, varRoot, declaration) {
    // Don't push existing declarations
    const current = this.alreadyDeclared(templateID, varRoot, declaration);
    if (current !== undefined) {
      return current;
    }
    const varName = this.next(templateID, varRoot);
    this.store[declaration(varName)] = varName;
    return varName;
  }

  alreadyDeclared(templateID, varRoot, declaration) {
    const existing = this.candidates(templateID, varRoot);
    for (var i = 0; i < existing.length; i++) {
      const candidate = `${this.varTemplateRoot(templateID, varRoot)}${i > 0 ? i : ''}`;
      const current = this.store[declaration(candidate)];
      if (current !== undefined) {
        return current;
      }
    }
  }

  candidates(templateID, varRoot) {
    const varTemplateRoot = this.varTemplateRoot(templateID, varRoot);
    return Object.values(this.store).filter(varName => varName.startsWith(varTemplateRoot));
  }

  length() {
    return Object.keys(this.store).length;
  }

  next(templateID, varRoot) {
    const existing = this.candidates(templateID, varRoot);

    // If the data does not exist in the store, then the count should append nothing to the variable name
    const count = existing.length > 0 ? existing.length : '';
    return `${this.varTemplateRoot(templateID, varRoot)}${count}`;
  }

  /**
   * Stringify the variable declarations
   *
   * @param {string} sep - Seperator string placed between elements in the resulting string of declarations
   * @returns {string} all the declarations as a string seperated by a line-break
   */
  toString(sep = '\n\n') {
    return Object.keys(this.store).join(sep);
  }

  varTemplateRoot(templateID, varRoot) {
    return `${varRoot}For${templateID}`;
  }
}

module.exports = DeclarationStore;

/**
 * Stores declarations for use in the DriverTemplate
 *
 * @returns {object}
 */
class DeclarationStore {
  constructor() {
    this.clear();
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
  addVar(templateID, varRoot, declaration) {
    // Don't push existing declarations
    const current = this.alreadyDeclared(templateID, varRoot, declaration);
    if (current !== undefined) {
      return current;
    }
    const varName = this.next(templateID, varRoot);
    this.vars[declaration(varName)] = varName;
    return varName;
  }

  /**
   * Add a function to the funcs set
   *
   * @param {string} fn - String literal of a function
   */
  addFunc(fn) {
    if (!this.funcs[fn]) {
      this.funcs[fn] = true;
    }
  }

  alreadyDeclared(templateID, varRoot, declaration) {
    const existing = this.candidates(templateID, varRoot);
    for (var i = 0; i < existing.length; i++) {
      const candidate = `${this.varTemplateRoot(templateID, varRoot)}${i > 0 ? i : ''}`;
      const current = this.vars[declaration(candidate)];
      if (current !== undefined) {
        return current;
      }
    }
  }

  candidates(templateID, varRoot) {
    const varTemplateRoot = this.varTemplateRoot(templateID, varRoot);
    return Object.values(this.vars).filter(varName => varName.startsWith(varTemplateRoot));
  }

  clear() {
    this.vars = {};
    this.funcs = {};
  }

  length() {
    return Object.keys(this.vars).length + Object.keys(this.funcs).length;
  }

  next(templateID, varRoot) {
    const existing = this.candidates(templateID, varRoot);

    // If the data does not exist in the vars, then the count should append nothing to the variable name
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
    return [...Object.keys(this.vars), ...Object.keys(this.funcs)].join(sep);
  }

  varTemplateRoot(templateID, varRoot) {
    return `${varRoot}${templateID}`;
  }
}

module.exports = DeclarationStore;

import {
  MongoshInternalError,
  MongoshInvalidInputError
} from '@mongosh/errors';
import { AsyncRewriterErrors } from './error-codes';
/* eslint no-console:0 */

export function addApi(newobj): any {
  newobj.api = true;
  if (newobj.attributes) {
    Object.keys(newobj.attributes).forEach((k) => {
      addApi(newobj.attributes[k]);
    });
  }
  return newobj;
}
/**
 * Symbol Table implementation, which is a stack of key-value maps.
 */
export default class SymbolTable {
  private scopeStack: object[];
  public signatures: any;
  public savedState: any;

  /**
   * Construct a new SymbolTable instance.
   * @param initialScope - usually empty, only set when deep copying SymbolTable.
   * @param signatures - a type object that has at least the 'type' and 'attributes' keys. Will be one of:
   *     unknown: { type: 'unknown', attributes?: {} }
   *     function: { type: 'function', returnsPromise?: bool, returnType?: type name or obj, attributes?: {} }
   *     class instance: { type: classname, attributes?: {} }
   *     class definition: { type: 'classdef', returnType: type name or obj }
   */
  constructor(initialScope: object[], signatures: object) {
    this.signatures = { unknown: { type: 'unknown', attributes: {} } };
    Object.assign(this.signatures, signatures);
    this.scopeStack = initialScope;
    Object.keys(signatures).forEach(s => {
      if (s === 'unknown' || this.lookup(s).type !== 'unknown') return;
      this.scopeAt(0)[s] = {
        type: 'classdef',
        returnType: this.signatures[s],
        api: true,
        returnsPromise: !!this.signatures[s].returnsPromise,
        hasAsyncChild: !!this.signatures[s].hasAsyncChild
      };
    });
    this.savedState = this.scopeStack;
  }

  private deepCopySymbol(symbol: any): any {
    try {
      return JSON.parse(JSON.stringify(symbol, this.replacer));
    } catch (error) {
      throw new MongoshInternalError(`Internal error occurred for copying symbol ${symbol.type}.`);
    }
  }

  /**
   * Initialize the shell API class instances like db, sh, rs, etc.
   *
   * @param apiObjects - set of class instance name and type.
   */
  public initializeApiObjects(apiObjects: object): void {
    Object.keys(apiObjects).forEach(key => {
      const copy = this.deepCopySymbol(apiObjects[key]);
      this.scopeAt(0)[key] = addApi(copy);
    });
    this.pushScope();
  }

  public replacer(k: string, v: any): any {
    if (k === 'path') return undefined;
    return v;
  }

  /**
   * Do a deep comparison of two type objects.
   *
   * @param t1
   * @param t2
   */
  public compareTypes(t1: any, t2: any): boolean {
    try {
      return (JSON.stringify(t1, this.replacer) === JSON.stringify(t2, this.replacer));
    } catch (error) {
      throw new MongoshInternalError(`Internal error occurred for comparing symbols ${t1.type} and ${t2.type}.`);
    }
  }

  /**
   * Make a deep copy of the symbols and return a new instance of SymbolTable.
   * Do not deep copy path attributes as they must stay as references to the AST.
   */
  public deepCopy(): SymbolTable {
    const newStack = this.deepCopyStack();
    return new SymbolTable(newStack, this.signatures);
  }

  public saveState(): void {
    this.savedState = this.deepCopyStack();
  }

  private deepCopyStack(): object[] {
    const newStack = [];
    this.scopeStack.forEach(oldScope => {
      const newScope = {};
      Object.keys(oldScope).forEach(key => {
        newScope[key] = this.deepCopySymbol(oldScope[key]);
        if ('path' in oldScope[key]) {
          newScope[key].path = oldScope[key].path;
        }
      });
      newStack.push(newScope);
    });
    return newStack;
  }

  public revertState(): void {
    this.scopeStack = this.savedState;
  }

  /**
   * Return the most recently scoped matching symbol.
   *
   * @param item
   */
  public lookup(item: string): any {
    for (let i = this.last; i >= 0; i--) {
      if (this.scopeStack[i][item]) {
        return this.scopeStack[i][item];
      }
    }
    return { type: 'unknown', attributes: {} };
  }

  private checkIfApi(key): void {
    if (key !== 'db' && key in this.scopeAt(0)) {
      throw new MongoshInvalidInputError(`Cannot modify Mongosh type ${key}`, AsyncRewriterErrors.ModifyMongoshType);
    }
  }

  /**
   * Add item to the current scope.
   *
   * @param item
   * @param value
   */
  public add(item: string, value: object): void {
    this.checkIfApi(item);
    this.scopeStack[this.last][item] = value;
  }

  /**
   * Add item to the parent of the current scope. This is for class name declarations since babel's
   * findFunctionParent will return self, and we need to add the classname to the parent scope.
   * @param item
   * @param value
   */
  public addToParent(item: string, value: object): void {
    this.checkIfApi(item);
    this.scopeStack[this.last - 1][item] = value;
  }

  /**
   * If item exists in the symbol table, update it and return true. Otherwise return false. Used for assignment
   * expressions because we first check if the LHS is a locally declared variable. If not then we need to treat it
   * like a hoisted var declaration.
   *
   * @param item
   * @param value
   */
  public updateIfDefined(item: string, value: object): boolean {
    this.checkIfApi(item);
    for (let i = this.last; i >= 0; i--) {
      if (this.scopeStack[i][item]) {
        this.scopeStack[i][item] = value;
        return true;
      }
    }
    return false;
  }

  /**
   * Update a variable's attributes via a set of keys
   *
   * @param lhs
   * @param keys
   * @param value
   */
  public updateAttribute(lhs, keys: string[], value: any): void {
    this.checkIfApi(lhs);
    const item = this.lookup(lhs);
    if (item.api) {
      throw new MongoshInvalidInputError(`Cannot modify attribute of Mongosh type ${lhs}`, AsyncRewriterErrors.ModifyMongoshType);
    }
    keys.reduce((sym, key, i) => {
      if (sym.type === 'unknown') {
        sym.type = 'object';
      }
      sym.hasAsyncChild = !!sym.hasAsyncChild || !!value.hasAsyncChild;
      if (sym.attributes === undefined) {
        sym.attributes = {};
      }
      if (i < keys.length - 1) {
        if (sym.attributes[key] === undefined) {
          sym.attributes[key] = { type: 'object', attributes: {}, hasAsyncChild: !!value.hasAsyncChild };
        }
        return sym.attributes[key];
      }
      sym.attributes[key] = value;
    }, item);
  }

  /**
   * Update a function-scoped variable. Get the correct scope from the AST and update enclosing scope.
   *
   * @param path - babel Path instance.
   * @param key - the name of the symbol.
   * @param type - the type of the object
   * @param t - babel's types helper.
   */
  public updateFunctionScoped(path: any, key: string, type: object, t: any): void {
    // Because it adds to scopes only via nodes, will add to actual ST regardless of branching
    this.checkIfApi(key);
    let scopeParent = path.getFunctionParent();
    if (scopeParent === null) {
      scopeParent = path.findParent(p => t.isProgram(p));
    }
    const shellScope = scopeParent.node.shellScope || 1;
    this.scopeAt(shellScope)[key] = type;
  }

  /**
   * Remove and return the most recent scope.
   */
  public popScope(): object | undefined {
    if (this.depth === 1) return undefined;
    return this.scopeStack.pop();
  }

  /**
   * Add a new scope and return it's index.
   */
  public pushScope(): number {
    const scope = {};
    return this.scopeStack.push(scope) - 1;
  }

  /**
   * The depth of the symbol table.
   */
  public get depth(): number {
    return this.scopeStack.length;
  }

  /**
   * The index of the most recent scope.
   */
  public get last(): number {
    return this.depth - 1;
  }

  /**
   * Get the scope at a given index.
   * @param i
   */
  public scopeAt(i: number): any {
    return this.scopeStack[i];
  }

  /**
   * Compare a series of symbol tables. Used for comparing the results of branching expressions.
   *
   * Go through each scope and if any symbols differ, set type to unknown *unless* either is a Shell API type. If so,
   * then error because we cannot infer types since we do not do any branch prediction.
   *
   * If any alternative symbol table has a variable defined that is not in the current symbol table, add it as it must
   * have been a hoisted variable.
   *
   * @param alternates
   */
  public compareSymbolTables(alternates: SymbolTable[]): void {
    this.scopeStack.forEach((thisScope, i) => {
      // Get all the possible keys at the current scope for each alternative
      const keys = new Set();
      alternates.forEach((st) => {
        if (this.depth !== st.depth) {
          throw new MongoshInternalError('Could not compare scopes.');
        }
        Object.keys(st.scopeAt(i)).forEach(k => keys.add(k));
      });
      keys.forEach((k: number) => {
        const equal = alternates.every((a) => this.compareTypes(a.scopeAt(i)[k], alternates[0].scopeAt(i)[k]));
        if (equal) {
          // If every alternative has the same type, then add it to the current symbol table.
          thisScope[k] = alternates[0].scopeAt(i)[k];
        } else {
          // Otherwise, check if any of the alternatives has that key as a Shell API type.
          const hasAsync = alternates.some((a) => a.scopeAt(i)[k] !== undefined && (a.scopeAt(i)[k].hasAsyncChild || a.scopeAt(i)[k].returnsPromise));
          if (hasAsync) {
            throw new MongoshInvalidInputError(`Cannot conditionally assign Mongosh API types. Type type of ${k} is unable to be inferred. Try using a locally scoped variable instead.`, AsyncRewriterErrors.MixedApiTypeInScope);
          } else {
            // Types differ, but none are async, so can safely just call it unknown.
            thisScope[k] = { type: 'unknown', attributes: {} };
          }
        }
      });
    });
  }

  /**
   * Return a string representation of a given symbol for debugging.
   *
   * @param symbol
   * @param key
   */
  public printSymbol(symbol: any, key: string): string {
    return `  ${key}: ${JSON.stringify(symbol, (k, v) => {
      if (k === 'path') return `Node[${v.type}]`;
      return v;
    }, 2)}`;
  }

  /**
   * Print out the entire symbol table for debugging.
   */
  public print(): void {
    console.log('----Printing Symbol Table----');
    for (let scopeDepth = this.last; scopeDepth >= 0; scopeDepth--) {
      const scope = this.scopeStack[scopeDepth];
      console.log(`scope@${scopeDepth}:`);
      Object.keys(scope).filter((s) => (!scope[s].api)).forEach((k) => {
        console.log(this.printSymbol(scope[k], k));
      });
    }
    console.log('-----------------------------');
  }
}


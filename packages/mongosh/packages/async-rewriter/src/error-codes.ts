// Note: Codes are shared with the new async rewriter

/**
 * @mongoshErrors
 */
enum AsyncRewriterErrors {
  /**
   * Signals the use of destructuring with Mongosh API objects which we currently do not support.
   *
   * Examples causing error:
   * ```
   * const [a, b] = [1, db];
   * const { var1, var2 } = { var1: 1, var2: db };
   * ```
   * Here `db` refresh to the database Mongosh API object and thus cannot be used.
   *
   * This also applies to the use of methods of `db` or `collections` that produce Mongosh API types.
   *
   * **Solution: Directly reference elements of arrays or members of objects, e.g. `arr[0]` or `obj.dbVar`.**
   */
  DestructuringNotImplemented = 'ASYNC-10001',

  /**
   * Signals the dynamic access of a Mongosh API type which we currently do not support (this includes access and assignment).
   *
   * Examples causing error:
   * ```
   * const wrapper = { database: db };
   * const key = 'database';
   * wrapper[key].get(...); // <-- fails
   *
   * const collectionName = 'someColl';
   * db[collectionName].find(...); // <-- fails
   *
   * wrapper[key] = newDb; // <-- fails
   * ```
   * **Solution: Do not use dynamic access but explicit access, e.g. `wrapper.database`, or `db.get('someColl')`.**
   */
  DynamicAccessOfApiType = 'ASYNC-10002',

  /**
   * Signals the use of `this` outside the body of a method or constructor of a class.
   * We currently do not support `this` in function or global scope.
   *
   * Examples causing error:
   * ```
   * function usingThis() {
   *   this.x = 5;
   * }
   *
   * const obj = {
   *   memberMethod(): {
   *     this.x = 5;
   *   }
   * };
   * ```
   *
   * **Solution: Only use `this` inside the body of a method or constructor of a class.**
   */
  UsedThisOutsideOfMethodOfClassDeclaration = 'ASYNC-10003',

  /**
   * Signals the use of for-in and for-of loops which we currently do not support.
   *
   * Examples causing error:
   * ```
   * for (let v of anArray) {
   *   ...
   * }
   * for (let key in anObject) {
   *   ...
   * }
   * ```
   *
   * **Solution: rewrite using a regular for loop with counter and/or `Array.forEach` and/or `Object.keys`.**
   */
  ForInForOfUnsupported = 'ASYNC-10004',

  /**
   * Signals an issue where a symbol in a scope can be of different known Mongosh API types (e.g. `db` and `db.coll`) and/or non API types (e.g. plain `1`).
   * This error is also raised, when a so far undeclared variable is initialized in an inner block with a Mongosh API type, i.e. it does not support hoisting.
   *
   * Examples causing error:
   * ```
   * if (x < 5) {
   *   a = db; // <-- fails since a is not yet declared, but now initialized in an inner block with Mongosh API type
   *   var b = db; // <-- fails since b is a var and would be hoisted
   * }
   * let a = db; // db is a Mongosh API type
   * for (let i = 0; i < 5; i++) {
   *   a = 2; // <-- fails since a would be assigned a different type
   * }
   * switch (var) {
   *   case 'A':
   *     x = db; // <-- fails since x is first declared here but is hoisted
   *   case 'C':
   *     x = db.coll1; // <-- fails
   * }
   * ```
   *
   * **Solution: Do not mix Mongosh API and non API types as values of a variable - use separate variables instead and declare variables explicitly before/with initialization.**
   */
  MixedApiTypeInScope = 'ASYNC-10005',

  /**
   * Signals the use of an assignment to a property/member of a member of `this`, i.e. assigning to a nested path below `this`.
   *
   * Example causing error:
   * ```
   * class Test {
   *   constructor() {
   *     this.obj = {};
   *     this.obj.database = db; // <-- fails since obj.database is a nested path below this
   *   }
   * }
   * ```
   *
   * **Solution: Do not assign to nested paths of `this`.**
   */
  NestedThisAssignment = 'ASYNC-10006',

  /**
   * Signals passing a Mongosh API type as the argument of a function which is currently _only supported for `forEach` of arrays/iterators_.
   *
   * Examples causing error:
   * ```
   * function myFunction(arg) {
   *   ...
   * }
   * myFunction(db); // <-- fails since db is the global Mongosh Database API type
   *
   * function anotherFunction() {
   *   db.collection.insertOne({ ... });
   * }
   * myFunction(anotherFunction); // <-- fails since anotherFunction is leveraging Mongosh Database API type
   *
   * docData.forEach((s) => ( db.coll.insertOne(s) )); // ok
   * ```
   *
   * **Solution: Do not pass functions using Mongosh API types or values of Mongosh API types as arguments to functions except array/iterator `forEach`.**
   */
  ApiTypeAsFunctionArgument = 'ASYNC-10007',

  /**
   * Signals the declaration of a function or method that has a conditional return statement and at least one returns a Mongosh API type.
   * Note that this includes the use of recursion - a recursive function call is treated as a different return type.
   *
   * Examples causing error:
   * ```
   * function myFunc(param) {
   *   if (param) {
   *     return 1; // <-- first return statement
   *   } else {
   *     return db; // <-- fails since one of the possible return types is db, i.e. a Mongosh API type
   *   }
   * }
   * function otherFunc(param) {
   *   if (param) {
   *     return db.coll1; // <-- first return statement, Mongosh API return type
   *   } else {
   *     return db.coll2; // <-- second return statement with same type, still fails
   *   }
   * }
   * function recursive(param) {
   *   if (param) {
   *     return db;
   *   }
   *   return f(); // <-- fails due to the use of recursion and another Mongosh API return type
   * }
   * ```
   *
   * **Solution: Include a single return statement in the function returning an unambiguous Mongosh API type.**
   */
  ConditionalReturn = 'ASYNC-10008',

  /**
   * Signals using a member of a class before it has been defined. The only exception of this is inside the constructor.
   *
   * Examples causing error:
   * ```
   * class Test {
   *   constructor() {
   *     this.logData(); // <-- allowed since inside constructor
   *   }
   *
   *   memberFn() {
   *     this.logData(); // <-- fails since not inside constructor and logData is only defined later
   *   }
   *
   *   logData() {
   *     // ...
   *   }
   * }
   * ```
   *
   * **Solution: Do not use members of a class before they have been defined, re-order them where necessary.**
   */
  UsedMemberInClassBeforeDefinition = 'ASYNC-10009',

  /**
   * Signals the use of a conditional expression that evaluates to different Mongosh API types.
   *
   * Examples causing error:
   * ```
   * let x = TEST_VAR ? 0 : db; // <-- fails since 0 is a regular type but db is a Mongosh API type
   * let y = TEST_VAR ? db : db.coll; // <-- fails since db and db.coll are both Mongosh API types - but different ones
   * ```
   *
   * **Solution: The conditional expression should evaluate to either no Mongosh API types or in all branches to a single Mongosh API type.**
   */
  ConditionalAssignment = 'ASYNC-10010',

  /**
   * Signals code that tries to override, redeclare, or modify global Mongosh API variables or types.
   *
   * Examples causing error:
   * ```
   * rs = 1; // <-- fails since rs is the global variable to access Replica Set API
   * const rs = 1; // <-- fails since rs is the global variable to access Replica Set API
   * db.x = 1; // <-- fails since it would modify the db global variable to access the Database API
   *
   * const other = db; // ok
   * other.x = 1; // <-- fails since it would modify the db global variable to access the Database API
   * ```
   *
   * **Solution: Do not modify Mongosh API types.**
   */
  ModifyMongoshType = 'ASYNC-10011',

  /**
   * Signals that an internal assertion was violated that guards uncovered code paths.
   * This error is only thrown when an assumed impossible situation occurs.
   *
   * **Please file a bug report for the `MONGOSH` project here: https://jira.mongodb.org.**
   */
  UnreachableAssertionViolated = 'ASYNC-90001',

  /**
   * Signals an internal error while trying to process user input.
   *
   * **Please file a bug report for the `MONGOSH` project here: https://jira.mongodb.org.**
   */
  CopySymbolFailed = 'ASYNC-90002',

  /**
   * Signals an internal error while trying to process user input.
   *
   * **Please file a bug report for the `MONGOSH` project here: https://jira.mongodb.org.**
   */
  CompareTypesFailed = 'ASYNC-90003',

  /**
   * Signals an internal error while trying to process user input.
   *
   * **Please file a bug report for the `MONGOSH` project here: https://jira.mongodb.org.**
   */
  CompareScopesDifferentDepth = 'ASYNC-90004'
}

export {
  AsyncRewriterErrors
};

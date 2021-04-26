# next-gen async-rewriter

This package contains babel plugins that transpile code in a way that allows
implicitly `await`ing selecting Promises.

## Motivation

The predecessor of this package uses a symbol-table-based approach, in which it
uses static analysis to keep track of which function calls would end up needing
an implicit `await` in front of it. This is brittle and strongly limits the
set of JS features that could be used in the shell, as well as the ways in which
one could interact with API object programmatically.

Therefore, this package drops the static analysis part and focuses entirely on
transforming the code in a way that allows all 'interesting' work to happen at
runtime. It is fully stateless and enables removing any symbol table tracking.
It’s also easier to introduce support for more built-in JS functions that take
callbacks this way, as replacing them with a polyfill (that is also transformed)
does the trick here. As such, special-casing calls to e.g. `.forEach()` is no
longer necessary either.

Downsides to this approach are that it’s not currently taking into account
situations in which implicitly async functions cannot be used (e.g. class
constructors or synchronous generator functions), that we don’t error for
conflicting API usage (e.g. top-level variables with names like `db`) and
that error messages may end up referring to odd locations in the code (at least
without support for source maps).

## Idea

We (ab-)use the fact that `async function`s execute fully synchronously until
they reach their first `await` expression, and the fact that we can determine
which `Promise`s need `await`ing by marking them as such using decorators
on the API surface.

The transformation takes place in two main steps.

### Step one: IIFE wrapping

The input code is wrapped in an IIFE. For example:

```js
function foo() { return db.test.find(); }
class A {}
foo()
```

is converted into roughly:

```js
var A;

function foo() {
  return db.test.find();
}

(() => {
  A = class A {};
  return foo();
})();
```

Note how identifiers remain accessible in the outside environment, including
top-level functions being hoisted to the outside.

### Step two: Async function wrapping

We perform three operations:

1. We give all shorthand arrow functions statement bodies. This is necessary
   for the other steps to work.
2. We turn all input functions into async functions and generate non-async
   wrappers for them. We keep track of the execution state of the ’inner’
   async function when it is called, and forward synchronous results
   synchronously.
3. We add checks for most expressions inside the ‘inner’ function, which
   conditionally uses `await` based on whether the result of the expression
   has a specific `Symbol` property. This `Symbol` property is set by functions
   in the API whose results should be implicitly awaited.

This does result in a significant increase in code size. For example,

```js
(() => {
  return db.test.find().toArray();
})();
```

(which is the result of `db.test.find().toArray()` after Step 1) would be
turned into code looking like the following (some adjustments have been
made for readability).

```js
(() => {
  // Keep a copy of the original source code for Function.prototype.toString.
  '<async_rewriter>(() => {\n  return db.test.find().toArray();\n})</>';
  const _syntheticPromise = Symbol.for("@@mongosh.syntheticPromise");

  function _markSyntheticPromise(p) {
    return Object.defineProperty(p, _syntheticPromise, {
      value: true
    });
  }

  function _isp(p) { // '_isSyntheticPromise' would be way too long here
    return p && p[_syntheticPromise];
  }

  function _demangleError(err) {
    // ... fix up the error message in 'err' using the original source code ...
  }

  let _functionState = "sync",
      _synchronousReturnValue,
      _ex;

  const _asynchronousReturnValue = (async () => {
    try {
      // All return statements are decorated with
      // `return (_synchronousReturnValue = ..., _functionState === 'async' ? _synchronousReturnValue : null)`
      // The function state check is here that, if we are returning synchronously,
      // we know that we are going to discard the value of `_asynchronousReturnValue`,
      // which is not what we want if the return value happens to be a rejected
      // Promise (because Node.js print a warning in that case).
      return (
        _synchronousReturnValue = (
          // Most expressions are wrapped in ('original source', _ex = ..., _isp(_ex) ? await _ex : _ex)
          _ex = ('db.test.find()',
            _ex = ('db.test',
              _ex = ('db',
                _ex = db, _isp(_ex) ? await _ex : _ex
              ).test, _isp(_ex) ? await _ex : _ex
            ).find(), _isp(_ex) ? await _ex : _ex
          ).toArray()
          , _isp(_ex) ? await _ex : _ex
        ),
        _functionState === 'async' ? _synchronousReturnValue : null);
    } catch (err) {
      err = _demangleError(err);
      if (_functionState === "sync") {
        // Forward synchronous exceptions.
        _synchronousReturnValue = err;
        _functionState = "threw";
      } else {
        // If we are already asynchronous, just return a rejected Promise as usual.
        throw err;
      }
    } finally {
      // If we did not throw here, we returned. Tell the caller that.
      if (_functionState !== "threw") {
        _functionState = "returned";
      }
    }
  })();

  if (_functionState === "returned") {
    return _synchronousReturnValue;
  } else if (_functionState === "threw") {
    throw _synchronousReturnValue;
  }

  _functionState = "async";
  // Since this was originally a non-async function, mark this as something
  // that should implicitly be awaited.
  return _markSyntheticPromise(_asynchronousReturnValue);
})();
```

## API

```js
import AsyncWriter from '@mongosh/async-rewriter2';
const transpiledCodeString = new AsyncWriter().process(inputCodeString);
```

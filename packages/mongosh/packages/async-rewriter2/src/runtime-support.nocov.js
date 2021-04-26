/* eslint-disable no-extend-native, eqeqeq, strict, new-cap, callback-return */
'use strict';
module.exports = '(' + function() {
  // Polyfills for various callback-taking JS builtins.
  // A lot of these are from their respective MDN pages.
  // Modifications that are not purely linter-based are
  // marked with XXX in that case.
  const TypedArray = Object.getPrototypeOf(Uint8Array);

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
  Array.prototype.forEach = function(callback, thisArg) {
    if (this == null) { throw new TypeError('Array.prototype.forEach called on null or undefined'); }

    let T; let k;
    // 1. Let O be the result of calling toObject() passing the
    // |this| value as the argument.
    const O = Object(this);

    // 2. Let lenValue be the result of calling the Get() internal
    // method of O with the argument "length".
    // 3. Let len be toUint32(lenValue).
    const len = O.length >>> 0;

    // 4. If isCallable(callback) is false, throw a TypeError exception.
    // See: https://es5.github.com/#x9.11
    if (typeof callback !== 'function') { throw new TypeError(callback + ' is not a function'); }

    // 5. If thisArg was supplied, let T be thisArg; else let
    // T be undefined.
    if (arguments.length > 1) { T = thisArg; }

    // 6. Let k be 0
    k = 0;

    // 7. Repeat, while k < len
    while (k < len) {
      let kValue;

      // a. Let Pk be ToString(k).
      //    This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty
      //    internal method of O with argument Pk.
      //    This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {
        // i. Let kValue be the result of calling the Get internal
        // method of O with argument Pk.
        kValue = O[k];

        // ii. Call the Call internal method of callback with T as
        // the this value and argument list containing kValue, k, and O.
        callback.call(T, kValue, k, O);
      }
      // d. Increase k by 1.
      k++;
    }
    // 8. return undefined
  };

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
  Array.prototype.map = function(callback/* , thisArg*/) {
    let T; let k;

    if (this == null) {
      throw new TypeError('this is null or not defined');
    }

    // 1. Let O be the result of calling ToObject passing the |this|
    //    value as the argument.
    const O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal
    //    method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    const len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: https://es5.github.com/#x9.11
    if (typeof callback !== 'function') {
      throw new TypeError(callback + ' is not a function');
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (arguments.length > 1) {
      T = arguments[1];
    }

    // 6. Let A be a new array created as if by the expression new Array(len)
    //    where Array is the standard built-in constructor with that name and
    //    len is the value of len.
    const A = new O.constructor(len); // XXX Was Array(len), modified for TypedArray compat

    // 7. Let k be 0
    k = 0;

    // 8. Repeat, while k < len
    while (k < len) {
      let kValue;
      let mappedValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal
      //    method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {
        // i. Let kValue be the result of calling the Get internal
        //    method of O with argument Pk.
        kValue = O[k];

        // ii. Let mappedValue be the result of calling the Call internal
        //     method of callback with T as the this value and argument
        //     list containing kValue, k, and O.
        mappedValue = callback.call(T, kValue, k, O);

        // iii. Call the DefineOwnProperty internal method of A with arguments
        // Pk, Property Descriptor
        // { Value: mappedValue,
        //   Writable: true,
        //   Enumerable: true,
        //   Configurable: true },
        // and false.

        // In browsers that support Object.defineProperty, use the following:
        // Object.defineProperty(A, k, {
        //   value: mappedValue,
        //   writable: true,
        //   enumerable: true,
        //   configurable: true
        // });

        // For best browser support, use the following:
        A[k] = mappedValue;
      }
      // d. Increase k by 1.
      k++;
    }

    // 9. return A
    return A;
  };

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
  Array.prototype.some = function(fun, thisArg) {
    if (this == null) {
      throw new TypeError('Array.prototype.some called on null or undefined');
    }

    if (typeof fun !== 'function') {
      throw new TypeError();
    }

    const t = Object(this);
    const len = t.length >>> 0;

    for (let i = 0; i < len; i++) {
      if (i in t && fun.call(thisArg, t[i], i, t)) {
        return true;
      }
    }

    return false;
  };

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
  Array.prototype.every = function(callbackfn, thisArg) {
    let T; let k;

    if (this == null) {
      throw new TypeError('this is null or not defined');
    }

    // 1. Let O be the result of calling ToObject passing the this
    //    value as the argument.
    const O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method
    //    of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    const len = O.length >>> 0;

    // 4. If IsCallable(callbackfn) is false, throw a TypeError exception.
    if (typeof callbackfn !== 'function' && Object.prototype.toString.call(callbackfn) !== '[object Function]') {
      throw new TypeError();
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (arguments.length > 1) {
      T = thisArg;
    }

    // 6. Let k be 0.
    k = 0;

    // 7. Repeat, while k < len
    while (k < len) {
      let kValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal
      //    method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {
        let testResult;
        // i. Let kValue be the result of calling the Get internal method
        //    of O with argument Pk.
        kValue = O[k];

        // ii. Let testResult be the result of calling the Call internal method
        // of callbackfn with T as the this value if T is not undefined
        // else is the result of calling callbackfn
        // and argument list containing kValue, k, and O.
        if (T) testResult = callbackfn.call(T, kValue, k, O);
        else testResult = callbackfn(kValue, k, O);

        // iii. If ToBoolean(testResult) is false, return false.
        if (!testResult) {
          return false;
        }
      }
      k++;
    }
    return true;
  };

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
  Array.prototype.filter = function(func, thisArg) {
    if ( ! (typeof func === 'function' && this) ) {
      throw new TypeError();
    }

    const len = this.length >>> 0;
    const res = new Array(len); // preallocate array
    const t = this; let c = 0; let i = -1;

    let kValue;
    if (thisArg === undefined) {
      while (++i !== len) {
        // checks to see if the key was set
        if (i in this) {
          kValue = t[i]; // in case t is changed in callback
          if (func(t[i], i, t)) {
            res[c++] = kValue;
          }
        }
      }
    } else {
      while (++i !== len) {
        // checks to see if the key was set
        if (i in this) {
          kValue = t[i];
          if (func.call(thisArg, t[i], i, t)) {
            res[c++] = kValue;
          }
        }
      }
    }

    res.length = c; // shrink down array to proper size
    return res;
  };

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw TypeError('"this" is null or not defined');
      }

      const o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      const len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      const thisArg = arguments[1];

      // 5. Let k be 0.
      let k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        const kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    },
    configurable: true,
    writable: true
  });

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      const o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      const len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      const thisArg = arguments[1];

      // 5. Let k be 0.
      let k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        const kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    },
    configurable: true,
    writable: true
  });

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
  Array.prototype.reduce = function(callback /* , initialValue*/) {
    if (this === null) {
      throw new TypeError( 'Array.prototype.reduce ' +
        'called on null or undefined' );
    }
    if (typeof callback !== 'function') {
      throw new TypeError( callback +
        ' is not a function');
    }

    // 1. Let O be ? ToObject(this value).
    const o = Object(this);

    // 2. Let len be ? ToLength(? Get(O, "length")).
    const len = o.length >>> 0;

    // Steps 3, 4, 5, 6, 7
    let k = 0;
    let value;

    if (arguments.length >= 2) {
      value = arguments[1];
    } else {
      while (k < len && !(k in o)) {
        k++;
      }

      // 3. If len is 0 and initialValue is not present,
      //    throw a TypeError exception.
      if (k >= len) {
        throw new TypeError( 'Reduce of empty array ' +
          'with no initial value' );
      }
      value = o[k++];
    }

    // 8. Repeat, while k < len
    while (k < len) {
      // a. Let Pk be ! ToString(k).
      // b. Let kPresent be ? HasProperty(O, Pk).
      // c. If kPresent is true, then
      //    i.  Let kValue be ? Get(O, Pk).
      //    ii. Let accumulator be ? Call(
      //          callbackfn, undefined,
      //          « accumulator, kValue, k, O »).
      if (k in o) {
        value = callback(value, o[k], k, o);
      }

      // d. Increase k by 1.
      k++;
    }

    // 9. Return accumulator.
    return value;
  };

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight
  Array.prototype.reduceRight = function(callback /* , initialValue*/) {
    if (this === null || typeof this === 'undefined') {
      throw new TypeError('Array.prototype.reduce called on null or undefined');
    }
    if (typeof callback !== 'function') {
      throw new TypeError(callback + ' is not a function');
    }
    const t = Object(this); const len = t.length >>> 0; let k = len - 1; let value;
    if (arguments.length >= 2) {
      value = arguments[1];
    } else {
      while (k >= 0 && !(k in t)) {
        k--;
      }
      if (k < 0) {
        throw new TypeError('Reduce of empty array with no initial value');
      }
      value = t[k--];
    }
    for (; k >= 0; k--) {
      if (k in t) {
        value = callback(value, t[k], k, t);
      }
    }
    return value;
  };

  // Custom: Map.prototype.forEach and Set.prototype.forEach
  Map.prototype.forEach = function(callback, thisArg) {
    [...this].forEach(([key, value]) => {
      callback.call(thisArg, value, key, this);
    });
  };
  Set.prototype.forEach = function(callback, thisArg) {
    [...this].forEach(value => {
      callback.call(thisArg, value, value, this);
    });
  };

  const origArraySort = Array.prototype.sort;
  Array.prototype.sort = function(compareFn) {
    return origArraySort.call(this, compareFn ? function(...args) {
      // (Ab-)use a generator function as one of the places where using
      // implicit async expression results in an error.
      return [...(function*() {
        yield compareFn(...args);
      })()][0];
    } : undefined);
  };
  const origTypedArraySort = TypedArray.prototype.sort;
  TypedArray.prototype.sort = function(compareFn) {
    return origTypedArraySort.call(this, compareFn ? function(...args) {
      // (Ab-)use a generator function as one of the places where using
      // implicit async expression results in an error.
      return [...(function*() {
        yield compareFn(...args);
      })()][0];
    } : undefined);
  };

  Array.prototype.flatMap = function(...args) {
    return Array.prototype.map.call(this, ...args).flat();
  };

  TypedArray.prototype.reduce = Array.prototype.reduce;
  TypedArray.prototype.reduceRight = Array.prototype.reduceRight;
  TypedArray.prototype.findIndex = Array.prototype.findIndex;
  TypedArray.prototype.find = Array.prototype.find;
  TypedArray.prototype.forEach = Array.prototype.forEach;
  TypedArray.prototype.map = Array.prototype.map;
  TypedArray.prototype.some = Array.prototype.some;
  TypedArray.prototype.every = Array.prototype.every;
  // Also custom. Can't use Array.prototype.filter here because that defines
  // the length ahead of the filtering.
  TypedArray.prototype.filter = function(func, thisArg) {
    const array = Array.prototype.filter.call(this, func, thisArg);
    return new (this.constructor)(array);
  };

  // Special addition: Function.prototype.toString!
  const origFptS = Function.prototype.toString;
  Function.prototype.toString = function() {
    const source = origFptS.call(this, arguments);
    const match = source.match(/^[^"]*"<async_rewriter>(?<encoded>[a-z0-9]+)<\/>";/);
    if (match) {
      // Decode using hex + UTF-16
      return String.fromCharCode(
        ...match.groups.encoded.match(/.{4}/g).map(hex => parseInt(hex, 16)));
    }
    return source;
  };
} + ')();';

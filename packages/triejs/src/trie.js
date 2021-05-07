/**
* Copyright (C) 2012 Paul Thurlow
*
* Permission is hereby granted, free of charge, to any person obtaining a copy 
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
(function() {

  /**
  * @decription Trie class for saving data by keywords accessible through
  *   word prefixes
  * @class
  * @version 0.1.5
  */
  var Triejs = function(opts) {

    /**
    * @private
    * @description Options for trie implementation
    * @type {Object}
    */
    this.options = {
    
      /**
      * @description Maximum number of items to cache per node
      * @type {Number}
      */
      maxCache: 10

      /**
      * @description Whether to handle caching on node levels
      * @type {Boolean}
      */
      , enableCache: true

      /**
      * @description Maintain insert ordering when adding to non cached trie
      * @type {Boolean}
      */
      , insertOrder: false

      /**
      * @description Return responses from root when requests is empty
      * @type {Boolean}
      */
      , returnRoot: false

      /**
      * @description Insert function for adding new items to cache
      * @type {Function}
      */
      , insert: null

      /**
      * @description Sorting function for sorting items to cache
      * @type {Function}
      */
      , sort: null

      /**
      * @description Clip function for removing old items from cache
      * @type {Function}
      */
      , clip: null

      /**
      * @description copy function for copying data between nodes
      * @type {Function}
      */
      , copy: null

      /**
      * @description Merge function to merge two data sets together
      * @type {Function}
      */
      , merge: null
    };

    /**
    * @private
    * @description trie object
    * @type {Object}
    */
    this.root = {};

    /**
    * @private
    * @description insert order index
    * @type {Number}
    */
    this.index = 0;

    // mixin optional override options
    for (var key in opts) {
      if (opts.hasOwnProperty(key)) {
        this.options[key] = opts[key];
      }
    };

    if (typeof this.options.insert != 'function') {
      this.options.insert = function(target, data) {
        // if maintaining insert ordering add a order index on insert
        if (this.options.insertOrder 
          && typeof data.d === 'undefined' 
          && typeof data.o === 'undefined') {
          data = { d: data, o: this.index++ };
        }
        if (target && target.length) {
          target.push(data);
        } else {
          target = [data];
        }
        return target;
      };
    }
    if (typeof this.options.sort != 'function') {
      if (!this.options.insertOrder) {
        this.options.sort = function() {
          this.sort();
        };
      } else if (this.options.insertOrder) {
        this.options.sort = function() {
          this.sort(function(a, b) { return a.o - b.o; });
        }
      }
    }
    if (typeof this.options.clip != 'function') {
      this.options.clip = function(max) {
        if (this.length > max) {
          this.splice(max, this.length - max);
        }
      };
    }
    if (typeof this.options.copy != 'function') {
      this.options.copy = function(data) {
        return data.slice(0);
      }
    }
    if (typeof this.options.merge != 'function') {
      this.options.merge = function(target, data, word) {
        for (var i = 0, ii = data.length; i < ii; i++) {
          target = this.options.insert.call(this, target, data[i]);
          this.options.sort.call(target, word);
          this.options.clip.call(target, this.options.maxCache);
        }
        return target;
      }
    }
  };

  Triejs.prototype = {

    /*-------------------------------------------------------------------------
    * Private Functions
    -------------------------------------------------------------------------*/

    /**
    * @description Add data to the current nodes cache
    * @param curr {Object} current node in trie
    * @param data {Object} Data to add to the cache
    * @private
    */
    _addCacheData: function(curr, data) {
      if ((this.root === curr && !this.options.returnRoot) 
        || this.options.enableCache === false) {
        return false;
      }
      if (!curr.$d) {
        curr.$d = {};
      }
      curr.$d = this.options.insert.call(this, curr.$d, data);
      this.options.sort.call(curr.$d);
      this.options.clip.call(curr.$d, this.options.maxCache);
      return true;
    }

    /**
    * @description Adds the remainder of a word to a subtree
    * @param suffix {String} the remainder of a word
    * @param data {Object} data to add at suffix
    * @param curr {Object} current node in the trie
    * @private
    */
    , _addSuffix: function(suffix, data, curr) {
      var letter = suffix.charAt(0)
        , nextSuffix = suffix.substring(1) || null
        , opts = { $d: {} };
      if (nextSuffix) {
        opts.$s = nextSuffix;
      }
      if (typeof curr[letter] === 'undefined') {
        curr[letter] = opts;
      } else if (typeof curr[letter].$d === 'undefined') {
        curr[letter].$d = {};
        if (nextSuffix && typeof curr[letter].$s === 'undefined') {
          curr[letter].$s = nextSuffix;
        }
      }
      curr[letter].$d = this.options.insert.call(this, curr[letter].$d, data);
      this.options.sort.call(curr[letter].$d);
    }

    /**
    * @description Move data from current location to new suffix position
    * @param suffix {String} the remainder of a word
    * @param data {Object} data currently stored to be moved to suffix ending
    * @param curr {Object} current node in the trie
    * @private
    */
    , _moveSuffix: function(suffix, data, curr) {
      var letter = suffix.charAt(0)
        , nextSuffix = suffix.substring(1) || null
        , opts = { $d: {} };
      if (nextSuffix) {
        opts.$s = nextSuffix;
      }
      if (typeof curr[letter] === 'undefined') {
        curr[letter] = opts;
      }
      curr[letter].$d = this.options.copy(data);
    }

    /**
    * @description Get data from a given node, either in the cache
    *   or by parsing the subtree
    * @param node {Object} The node to get data from
    * @return {Array|Object} data results
    */
    , _getDataAtNode: function(node, word) {
      var data;

      if (this.options.enableCache) {
        this.options.sort.call(node.$d, word);
        data = node.$d;
      } else {
        data = this._getSubtree(node, word);
      }
      if (this.options.insertOrder) {
        data = this._stripInsertOrder(data);
      }
      return data ? this.options.copy(data) : undefined;
    }

    /**
    * @description Remove the outer data later that stores insert order
    * @param data {Object} The data with insert order object wrapper
    * @return {Array} data results without insert order wrapper
    */
    , _stripInsertOrder: function(data) {
      if (typeof data == 'undefined') {
        return;
      }
      var temp = [];
      for (var i = 0, ii = data.length; i < ii; i++) {
        temp.push(data[i].d);
      }
      return temp;
    }

    /**
    * @description Get the subtree data of a trie traversing depth first
    * @param curr {Object} current node in the trie to get data under
    * @return {Object} data from the subtree
    */
    , _getSubtree: function(curr, word) {
      var res
        , nodeArray = [curr]
        , node;
      while (node = nodeArray.pop()) {
        for (var newNode in node) {
          if (node.hasOwnProperty(newNode)) {
            if (newNode == '$d') {
              if (typeof res == 'undefined') {
                res = [];
              }
              res = this.options.merge.call(this, res, node.$d, word);
            } else if (newNode != '$s') {
              nodeArray.push(node[newNode]);
            }
          }
        }
      }
      return res;
    }

    /*-------------------------------------------------------------------------
    * Public Functions
    -------------------------------------------------------------------------*/

    /**
    * @description Adds a word into the trie
    * @param word {String} word to add
    * @param data {Object} data to store under given term
    */
    , add: function(word, data) {
      if (typeof word != 'string') { return false; }
      if (arguments.length == 1) { data = word; }
      word = word.toLowerCase();

      var curr = this.root;

      for (var i = 0, ii = word.length; i < ii; i++) {
        var letter = word.charAt(i);
        // No letter at this level
        if (!curr[letter]) {
          // Current level has a suffix already so push suffix lower in trie
          if (curr.$s) {
            if (curr.$s == word.substring(i)) {
              // special case where word exists already, so we avoid breaking
              // up the substring and store both at the top level
              if (!this._addCacheData(curr, data)) {
                curr.$d = this.options.insert.call(this, curr.$d, data);
                this.options.sort.call(curr.$d);
              }
              break;
            }
            this._moveSuffix(curr.$s, curr.$d, curr);
            delete curr.$s;
            if (this.options.enableCache === false) {
              delete curr.$d;
            }
          }
          // Current level has no sub letter after building suffix
          if (!curr[letter]) {
            this._addSuffix(word.substring(i), data, curr);
            this._addCacheData(curr, data);
            break;
          }
          // add to the cache at the current node level in the trie
          this._addCacheData(curr, data);
          // if its the end of a word push possible suffixes at this node down
          // and add data to cache at the words end
          if (i == ii - 1) {
            if (curr[letter].$s) {
              this._moveSuffix(curr[letter].$s, curr[letter].$d, curr[letter]);
              delete curr[letter].$s;
              if (this.options.enableCache === false) {
                delete curr[letter].$d;
              }
              // insert new data at current end of word node level
              this._addSuffix(letter, data, curr);
            } else {
              // either add to cache or just add the data at end of word node
              if (!this._addCacheData(curr[letter], data)) {
                this._addSuffix(letter, data, curr);
              }
            }
          }
          curr = curr[letter];
        }
        // There is a letter and we are at the end of the word
        else if (i == ii - 1) {
          this._addCacheData(curr, data);
          // either add to cache at the end of the word or just add the data
          if (!this._addCacheData(curr[letter], data)) {
            this._addSuffix(letter, data, curr);
          }
        }
        // There is a letter so traverse lower into the trie
        else {
          this._addCacheData(curr, data);
          curr = curr[letter];
        }
      }
    }

    /**
    * @description remove a word from the trie if there is no caching
    * @param word {String} word to remove from the trie
    */
    , remove: function(word) {
      if (typeof word !== 'string' || word === '' || this.options.enableCache){
        return;
      }
      word = word.toLowerCase();
      var letter
        , i
        , ii
        , curr = this.root
        , prev
        , prevLetter
        , data
        , count = 0;

      for (i = 0, ii = word.length; i < ii; i++) {
        letter = word.charAt(i);
        if (!curr[letter]) {
          if (curr.$s && curr.$s === word.substring(i)) {
            break; // word is at this leaf node
          } else {
            return; // word not in the trie
          }
        } else {
          prev = curr;
          prevLetter = letter;
          curr = curr[letter]
        }
      }
      data = this.options.copy(curr.$d);
      if (this.options.insertOrder) {
        data = this._stripInsertOrder(data);
      }
      delete curr.$d;
      delete curr.$s;
      // enumerate all child nodes
      for (var node in curr) {
        if (curr.hasOwnProperty(node)) {
          count++;
        }
      }
      if (!count) {
        delete prev[prevLetter]; // nothing left at this level so remove it
      }
      return data;
    }

    /**
    * @description see if a word has been added to the trie
    * @param word {String} word to search for
    * @return {Boolean} whether word exists or not
    */
    , contains: function(word) {
      if (typeof word !== 'string' || word == '') { return false; }
      word = word.toLowerCase();

      var curr = this.root;
      for (var i = 0, ii = word.length; i < ii; i++) {
        var letter = word.charAt(i);
        if (!curr[letter]) {
          if (curr.$s && curr.$s === word.substring(i)) {
            return true;
          } else {
            return false;
          }
        } else {
          curr = curr[letter];
        }
      }
      return curr.$d && (typeof curr.$s === 'undefined') ? true : false;
    }

    /**
    * @description Get the data for a given prefix of a word
    * @param prefix {String} string of the prefix of a word
    * @return {Object} data for the given prefix
    */
    , find: function(prefix) {
      if (typeof prefix !== 'string') { return undefined; }
      if (prefix == '' && !this.options.returnRoot) { return undefined; }
      prefix = prefix.toLowerCase();

      var curr = this.root;
      for (var i = 0, ii = prefix.length; i < ii; i++) {
        var letter = prefix.charAt(i);
        if (!curr[letter]) {
          if (curr.$s && curr.$s.indexOf(prefix.substring(i)) == 0) {
            return this._getDataAtNode(curr, prefix);
          } else {
            return undefined;
          }
        } else {
          curr = curr[letter];
        }
      }
      return this._getDataAtNode(curr, prefix);
    }
  };

  //Export to CommonJS/Node format
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Triejs;
    }
    exports.Triejs = Triejs;
  } else if (typeof define === 'function' && define.amd) {
    define('triejs', function() {
      return Triejs;
    });
  } else {
    // no exports so attach to global
    this['Triejs'] = Triejs;
  }
})(this);
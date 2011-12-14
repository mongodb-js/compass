/**
* Copyright (C) 2011 Paul Thurlow
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
if (typeof exports === 'undefined') {
  var exports = {};
}

(function(exports) {
  /**
  * @decription Trie class for saving data by keywords accessible through
  *   word prefixes
  * @class
  */
  var Triejs = function(opts) {

    /**
    * @private
    * @description options for trie implementation
    * @type {Object}
    */
    this.options = {
    
      /**
      * @description Maximum number of items to cache per node
      * @type {Number}
      */
      maxCache: 10
    
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
    };

    /**
    * @private
    * @description trie object
    * @type {Object}
    */
    this.root = {};

    // mixin optional override options
    for (var key in opts) {
      if (opts.hasOwnProperty(key)) {
        this.options[key] = opts[key];
      }
    };

    if (typeof this.options.insert != 'function') {
      this.options.insert = function(target, data) {
        if (target.length) {
          target.push(data);
        } else {
          target = [data];
        }
        return target;
      };
    }
    if (typeof this.options.sort != 'function') {
      this.options.sort = function() {};
    }
    if (typeof this.options.clip != 'function') {
      this.options.clip = function(max) {
        if (this.length > max) {
          this.splice(0, this.length - max);
        }
      };
    }
    if (typeof this.options.copy != 'function') {
      this.options.copy = function(data) {
        return data.slice(0);
      }
    }
  };

  Triejs.prototype = {

    /**
    * @description Add data to the current nodes cache
    * @param curr {Object} current node in trie
    * @param data {Object} Data to add to the cache
    * @private
    */
    _addCacheData: function(curr, data) {
      if (curr == this.root) {
        return; // safety check to not store cache at root level
      }
      if (!curr.data) {
        curr.data = {};
      }
      curr.data = this.options.insert.call(this, curr.data, data);
      this.options.sort.call(curr.data);
      this.options.clip.call(curr.data, this.options.maxCache);
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
        , opts = { data: {} };
      if (nextSuffix) {
        opts.suffix = nextSuffix;
      }
      curr[letter] = opts;
      curr[letter].data = this.options.insert.call(this, curr[letter].data, data);
      //this.options.insert.call(this, curr[letter].data, data);
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
        , opts = { data: {} };
      if (nextSuffix) {
        opts.suffix = nextSuffix;
      }
      curr[letter] = opts;
      curr[letter].data = this.options.copy(data);
    }

    /**
    * @description Adds a word into the trie
    * @param word {String} word to add
    * @param data {Object} data to store under given term
    */
    , addWord: function(word, data) {
      if (typeof word != 'string') { return false; }
      word = word.toLowerCase();

      var curr = this.root;

      for (var i = 0, ii = word.length; i < ii; i++) {
        var letter = word.charAt(i);
        // No letter at this level
        if (!curr[letter]) {
          // Current level has a suffix already so push suffix lower in trie
          if (curr.suffix) {
            this._moveSuffix(curr.suffix, curr.data, curr);
            delete curr.suffix;
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
            if (curr[letter].suffix) {
              this._moveSuffix(curr[letter].suffix, curr[letter].data, curr[letter]);
              delete curr[letter].suffix;
            }
            this._addCacheData(curr[letter], data);
          }
          curr = curr[letter];
        }
        // There is a letter and we are at the end of the word
        else if (i == ii - 1) {
          this._addCacheData(curr, data);
          this._addCacheData(curr[letter], data);
        }
        // There is a letter so traverse lower into the trie
        else {
          this._addCacheData(curr, data);
          curr = curr[letter];
        }
      }
    }

    /**
    * @description Get the data for a given prefix of a word
    * @param prefix {String} string of the prefix of a word
    * @return {Object} data for the given prefix
    */
    , getPrefix: function(prefix) {
      if (typeof prefix !== 'string') { return undefined; }
      prefix = prefix.toLowerCase();

      var curr = this.root;
      for (var i = 0, ii = prefix.length; i < ii; i++) {
        var letter = prefix.charAt(i);
        if (!curr[letter]) {
          if (curr.suffix && curr.suffix.indexOf(prefix.substring(i)) == 0) {
            return curr.data;
          } else {
            return undefined;
          }
        } else {
          curr = curr[letter];
        }
      }
      return curr.data;
    }

    /**
    * @description Get the subtree data of a trie
    * @param curr {Object} current node in the trie to get data under
    * @return {Object} data from the subtree
    */
    , getSubtree: function(curr) {
      var res = []
        , nodeArray = [curr]
        , node;
      while (node = nodeArray.pop()) {
        for (var newNode in node) {
          if (node.hasOwnProperty(newNode)) {
            if (newNode == 'data') {
              res.push(node.data);
            } else if (newNode != 'suffix') {
              nodeArray.push(node[newNode]);
            }
          }
        }
      }
      return res;
    }
  };

  exports.Triejs = Triejs;
})(exports);
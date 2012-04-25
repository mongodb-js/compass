#Triejs [![Build Status](https://secure.travis-ci.org/pthurlow/triejs.png)](http://travis-ci.org/pthurlow/triejs)
A Javascript implementation of a trie data structure with an extensible data 
model to easily customize to any need.  Visit the [Triejs page](http://pthurlow.github.com/triejs) for more info and technical details.

##Usage

You can choose to drop Triejs into your project several ways.  You can download the raw source and add it via a script tag in your html.  Or if
you plan on using it in a node project you can install it via `npm install triejs`

###Basic
Creating a trie is as easy as creating a new object:

    > var Triejs = require('triejs');
    > var trie = new Triejs();

To add a word with some data associated it call `add`:

    > trie.add(<word>, <data>);

Now given any prefix of letters, you can return results possible words using `find`:

    > trie.find(<word>);
      => <data>

###Advanced

To customize the data just pass optional data, including functions to support data manipulation.  These 
include `sort` to sort data being entered, `insert` to customize how data is input, `copy` for moving data 
between nodes in the trie, and `clip` for removing data from the cache layer if it grows too big.

####Example

Options are passed via the constructor as a hash like so:

    var trie = new Triejs({
      // sort the data in the context 'this'
      sort: function() {
        this.sort(function(a, b) {
          return b.rank - a.rank;
        });
      }
      // insert data into the target
      , insert: function(target, data) {
        // override for non array implementation
      }
      // clip the data in the context 'this' to length max
      , clip: function(max) {
        this.splice(0, this.length - max);
      }
      // return a copy of data
      , copy: function(data) {
        // override and return new data for non array implementation
      }
      // merge data into target and return target
      , merge: function(target, data) {
        // override and return target with data merged in
      }
    });

##Testing

The test suite is built using [Bob Remeika's foounit](https://github.com/foobarfighter/foounit) and can be tested in both the browser and in node.
To test in node simple run the following command `node tests/vendor/suite.js` in the root directory or if Triejs was installed using `npm` then run `npm test`

To test in a browser you will need to `npm install` and then run `foounit serve` in the root directory.  Then you can direct your browser
to `localhost:5057/tests/vendor/runner.html` to see the test suite run

##License

Triejs is licensed under the [MIT License](http://www.opensource.org/licenses/mit-license.php) copyright (c) 2012 Paul Thurlow

foounit.require(':vendor/spec-helper');
var Triejs = foounit.require(':src/trie');

/**
* @description Test the default trie data implementation with
*   arrays of data stored at each node level
*/
describe('When using a custom array data source trie', function (){
  var trie;

  before(function (){
    trie = new Triejs({
      sort: function() {
        this.sort(function(a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); });
      }
    });
  });

  after(function() {
    delete trie;
  });

  /**
  * @description test for adding single words
  */
  describe('and adding a word', function() {

    before(function() {
      trie.addWord('test', {name: 'word'});
    })

    it('it exists in the trie', function (){
      expect(trie.getPrefix('test')).to(equal, [{name: 'word'}]);
    });

    it('it can be retrieved by prefix', function (){
      expect(trie.getPrefix('t')).to(equal, [{name: 'word'}]);
      expect(trie.getPrefix('te')).to(equal, [{name: 'word'}]);
      expect(trie.getPrefix('tes')).to(equal, [{name: 'word'}]);
    });

    it('it is not found when using incorrect prefix', function (){
      expect(trie.getPrefix('wrong')).toNot(equal, [{name: 'word'}]);
      expect(trie.getPrefix('wrong')).to(beUndefined);
    });

    it('it is not found when using non string prefix', function (){
      expect(trie.getPrefix(true)).to(beUndefined);
      expect(trie.getPrefix(1)).to(beUndefined);
      expect(trie.getPrefix(function() {})).to(beUndefined);
      expect(trie.getPrefix(null)).to(beUndefined);
      expect(trie.getPrefix(undefined)).to(beUndefined);
    });
  });

  /**
  * @description test for invalid input to addWord function
  */
  describe('and adding a non string word', function() {

    before(function() {
      trie.addWord(1, {name: 'word'});
      trie.addWord(false, {name: 'word'});
      trie.addWord(function() {}, {name: 'word'});
      trie.addWord(null, {name: 'word'});
      trie.addWord(undefined, {name: 'word'});
    })

    it('it adds nothing to the trie', function (){
      expect(trie.root).to(equal, {});
    });
  });

  /**
  * @description test adding multiple words
  */
  describe('and adding two words', function() {

    before(function() {
      trie.addWord('test', {name: 'word'});
      trie.addWord('testing', {name: 'another word'});
    })

    it('they exist in the trie', function (){
      expect(trie.getPrefix('test')).to(equal, [{name: 'another word'}, {name: 'word'}]);
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and adding a word with capitals', function() {

    before(function() {
      trie.addWord('Test', {name: 'word'});
    })

    it('it can be found in the trie', function (){
      expect(trie.getPrefix('test')).to(equal, [{name: 'word'}]);
    });
    it('it can be found in the trie with capitals', function (){
      expect(trie.getPrefix('Test')).to(equal, [{name: 'word'}]);
    });
  });

    /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and modifying an added word', function() {

    before(function() {
      trie.addWord('test', {name: 'word'});
    })

    it('it does not modify the word in the tree', function (){
      var words = trie.getPrefix('test');
      words[0] = 'new';
      expect(trie.getPrefix('test')).to(equal, [{name: 'word'}]);
    });
  });

  /**
  * @description test returning results over the max cache amount
  */
  describe('and adding more words than the cache', function() {

    before(function() {
      trie.addWord('testone', {name: 'one'});
      trie.addWord('testtwo', {name: 'two'});
      trie.addWord('testthree', {name: 'three'});
      trie.addWord('testfour', {name: 'four'});
      trie.addWord('testfive', {name: 'five'});
      trie.addWord('testsix', {name: 'six'});
      trie.addWord('testseven', {name: 'seven'});
      trie.addWord('testeight', {name: 'eight'});
      trie.addWord('testnine', {name: 'nine'});
      trie.addWord('testten', {name: 'ten'});
      trie.addWord('testeleven', {name: 'eleven'});
    })

    it('it only returns the max number of results', function (){
      expect(trie.getPrefix('t')).to(equal,
        [
          {name:'eight'}
        , {name:'eleven'}
        , {name:'five'}
        , {name: 'four'}
        , {name: 'nine'}
        , {name: 'one'}
        , {name: 'seven'}
        , {name: 'six'}
        , {name: 'ten'}
        , {name: 'three'}
      ]);
    });
  });
});

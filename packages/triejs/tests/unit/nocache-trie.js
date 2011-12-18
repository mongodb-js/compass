foounit.require(':vendor/spec-helper');
var Triejs = foounit.require(':src/trie');

/**
* @description Test the cache disabled trie data implementation with
*   data only stored at the suffix level
*/
describe('When using a trie with no cache', function (){
  var trie;

  before(function (){
    trie = new Triejs({ enableCache: false });
  });

  after(function() {
    delete trie;
  });

  /**
  * @description test for adding single words
  */
  describe('and adding a word', function() {

    before(function() {
      trie.addWord('test', 'word');
    })

    it('it exists in the trie', function (){
      expect(trie.getPrefix('test')).to(equal, ['word']);
    });

    it('it can be retrieved by prefix', function (){
      expect(trie.getPrefix('t')).to(equal, ['word']);
      expect(trie.getPrefix('te')).to(equal, ['word']);
      expect(trie.getPrefix('tes')).to(equal, ['word']);
    });

    it('it is not found when using incorrect prefix', function (){
      expect(trie.getPrefix('wrong')).toNot(equal, ['word']);
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
      trie.addWord(1, 'word');
      trie.addWord(false, 'word');
      trie.addWord(function() {}, 'word');
      trie.addWord(null, 'word');
      trie.addWord(undefined, 'word');
    })

    it('it adds nothing to the trie', function (){
      expect(trie.root).to(equal, {});
    });
  });

  /**
  * @description test for adding words as a single argument
  */
  describe('and adding a word without data', function() {

    before(function() {
      trie.addWord('word');
    })

    it('it adds the word as the data', function (){
      expect(trie.getPrefix('w')).to(equal, ['word']);
    });
  });

  /**
  * @description test adding multiple words
  */
  describe('and adding two words', function() {

    before(function() {
      trie.addWord('test', 'word');
      trie.addWord('testing', 'another word');
    })

    it('they exist in the trie', function (){
      expect(trie.getPrefix('test')).to(equal, ['another word', 'word']);
    });
  });

  /**
  * @description test adding multiple words
  */
  describe('and adding two words', function() {

    before(function() {
      trie.addWord('abc', 'another word');
      trie.addWord('ab', 'word');
    })

    it('they exist in the trie', function (){
      expect(trie.getPrefix('a')).to(equal, ['another word', 'word']);
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and adding a word with capitals', function() {

    before(function() {
      trie.addWord('Test', 'word');
    })

    it('it can be found in the trie', function (){
      expect(trie.getPrefix('test')).to(equal, ['word']);
    });
    it('it can be found in the trie with capitals', function (){
      expect(trie.getPrefix('Test')).to(equal, ['word']);
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and modifying an added word', function() {

    before(function() {
      trie.addWord('test', 'word');
    })

    it('it does not modify the word in the tree', function (){
      var words = trie.getPrefix('test');
      words[0] = 'new';
      expect(trie.getPrefix('test')).to(equal, ['word']);
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and adding a word with unicode characters', function() {

    before(function() {
      trie.addWord('test\\u0B9x\\u0D9x\\u091x', 'word');
    })

    it('it is found in the trie', function (){
      expect(trie.getPrefix('test\\u0B9x')).to(equal, ['word']);
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and adding a word with unicode characters and splitting on unicode chars', function() {

    before(function() {
      trie.addWord('test\\u0B9x\\u0D9x\\u091x', 'word');
      debugger
      trie.addWord('test\\u0B9x\\u0D9x', 'another word');
    })

    it('it is found in the trie', function (){
      expect(trie.getPrefix('test\\u0B9x')).to(equal, ['another word','word']);
    });
  });

  /**
  * @description test returning results over the max cache amount
  */
  describe('and adding more words than the cache', function() {

    before(function() {
      trie.addWord('testone', 'one');
      trie.addWord('testtwo', 'two');
      trie.addWord('testthree', 'three');
      trie.addWord('testfour', 'four');
      trie.addWord('testfive', 'five');
      trie.addWord('testsix', 'six');
      trie.addWord('testseven', 'seven');
      trie.addWord('testeight', 'eight');
      trie.addWord('testnine', 'nine');
      trie.addWord('testten', 'ten');
      trie.addWord('testeleven', 'eleven');
    })

    it('it only returns the max number of results', function (){
      expect(trie.getPrefix('t')).to(
        equal
        , ['eight','eleven','five','four','nine','one','seven','six','ten','three']);
    });
  });
});

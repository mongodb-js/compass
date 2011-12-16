foounit.require(':vendor/spec-helper');
var Triejs = foounit.require(':src/trie');

/**
* @description Test the default trie data implementation with
*   arrays of data stored at each node level
*/
describe('When using a default trie', function (){
  var trie;

  before(function (){
    trie = new Triejs();
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
});

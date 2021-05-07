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

    it('it exists in the trie', function (){
      trie.add('test', 'word');
      expect(trie.find('test')).to(equal, ['word']);
    });

    it('it can be retrieved by prefix', function (){
      trie.add('test', 'word');
      expect(trie.find('t')).to(equal, ['word']);
      expect(trie.find('te')).to(equal, ['word']);
      expect(trie.find('tes')).to(equal, ['word']);
    });

    it('it is not found when using incorrect prefix', function (){
      trie.add('test', 'word');
      expect(trie.find('wrong')).toNot(equal, ['word']);
      expect(trie.find('wrong')).to(beUndefined);
      expect(trie.find('testt')).to(beUndefined);
    });

    it('it is not found when using non string prefix', function (){
      trie.add('test', 'word');
      expect(trie.find(true)).to(beUndefined);
      expect(trie.find(1)).to(beUndefined);
      expect(trie.find(function() {})).to(beUndefined);
      expect(trie.find(null)).to(beUndefined);
      expect(trie.find(undefined)).to(beUndefined);
    });

    it('it is a copy and not the original variable', function (){
      var data = 'word';
      trie.add('test', data);
      data = 'wrong';
      expect(trie.find('t')).to(equal, ['word']);
    });
  });

  /**
  * @description test for invalid input to add function
  */
  describe('and adding a non string word', function() {

    before(function() {
      trie.add(1, 'word');
      trie.add(false, 'word');
      trie.add(function() {}, 'word');
      trie.add(null, 'word');
      trie.add(undefined, 'word');
    });

    it('it adds nothing to the trie', function (){
      expect(trie.root).to(equal, {});
    });
  });

  /**
  * @description test for adding words as a single argument
  */
  describe('and adding a word without data', function() {

    before(function() {
      trie.add('word');
    });

    it('it adds the word as the data', function (){
      expect(trie.find('w')).to(equal, ['word']);
    });
  });

  /**
  * @description test adding multiple words
  */
  describe('and adding two words', function() {

    before(function() {
      trie.add('test', 'word');
      trie.add('testing', 'another word');
    });

    it('they exist in the trie', function (){
      expect(trie.find('t')).to(equal, ['another word', 'word']);
    });
  });

  /**
  * @description test adding identical words
  */
  describe('and adding two identical words', function() {

    before(function() {
      trie.add('test', 'word');
      trie.add('test', 'another word');
    });

    it('they exist in the trie', function () {
      expect(trie.find('test')).to(equal, ['another word', 'word']);
    });
    it('they share the same substring', function () {
      expect(trie.root).to(equal, {t:{'$s': 'est', '$d': ['another word', 'word']}});
    });
  });

  /**
  * @description test adding three words
  */
  describe('and adding three identical words', function() {

    before(function() {
      trie.add('test', 'word');
      trie.add('test', 'word');
      trie.add('test', 'word');
    });

    it('they exist in the trie', function () {
      expect(trie.find('test')).to(equal, ['word', 'word', 'word']);
    });
    it('they don\'t add excess letters in the trie', function () {
      expect(trie.find('testt')).to(beUndefined);
    });
  });


  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and adding a word with capitals', function() {

    before(function() {
      trie.add('Test', 'word');
    });

    it('it can be found in the trie', function (){
      expect(trie.find('test')).to(equal, ['word']);
    });
    it('it can be found in the trie with capitals', function (){
      expect(trie.find('Test')).to(equal, ['word']);
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and modifying an added word', function() {

    before(function() {
      trie.add('test', 'word');
    });

    it('it does not modify the word in the tree', function (){
      var words = trie.find('test');
      words[0] = 'new';
      expect(trie.find('test')).to(equal, ['word']);
    });
  });

  /**
  * @description test unicode letters in words and with prefix fetching
  */
  describe('and adding a word with unicode characters', function() {

    before(function() {
      trie.add('test\u0B9x\u0D9x\u091x', 'word');
    })

    it('it is found in the trie', function (){
      expect(trie.find('test\u0B9x')).to(equal, ['word']);
    });
  });

  /**
  * @description test multiple unicode words with overlap
  */
  describe('and adding a word with unicode characters and splitting on unicode chars', function() {

    before(function() {
      trie.add('test\u0B9x\u0D9x\u091x', 'word');
      trie.add('test\u0B9x\u0D9x', 'another word');
    })

    it('it is found in the trie', function (){
      expect(trie.find('test\u0B9x')).to(equal, ['another word','word']);
    });
  });

  /**
  * @description test returning results over the max cache amount
  */
  describe('and adding more words than the cache', function() {

    before(function() {
      trie.add('testone', 'one');
      trie.add('testtwo', 'two');
      trie.add('testthree', 'three');
      trie.add('testfour', 'four');
      trie.add('testfive', 'five');
      trie.add('testsix', 'six');
      trie.add('testseven', 'seven');
      trie.add('testeight', 'eight');
      trie.add('testnine', 'nine');
      trie.add('testten', 'ten');
      trie.add('testeleven', 'eleven');
    })

    it('it only returns the max number of results', function (){
      expect(trie.find('t')).to(
        equal
        , ['eight','eleven','five','four','nine','one','seven','six','ten','three']);
    });
  });
});

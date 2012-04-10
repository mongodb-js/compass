foounit.require(':vendor/spec-helper');
var Triejs = foounit.require(':src/trie');

/**
* @description Test the cache disabled trie data implementation with
*   data only stored at the suffix level
*/
describe('When using a trie with no cache and insert order', function (){
  var trie;

  before(function (){
    trie = new Triejs({ enableCache: false, insertOrder: true });
  });

  after(function() {
    delete trie;
  });

  /**
  * @description test for adding single words
  */
  describe('and adding a word', function() {

    before(function() {
      trie.add('test', 'word');
    })

    it('it exists in the trie', function (){
      expect(trie.find('test')).to(equal, ['word']);
    });

    it('it can be retrieved by prefix', function (){
      expect(trie.find('t')).to(equal, ['word']);
      expect(trie.find('te')).to(equal, ['word']);
      expect(trie.find('tes')).to(equal, ['word']);
    });

    it('it is not found when using incorrect prefix', function (){
      expect(trie.find('wrong')).toNot(equal, ['word']);
      expect(trie.find('wrong')).to(beUndefined);
    });

    it('it is not found when using non string prefix', function (){
      expect(trie.find(true)).to(beUndefined);
      expect(trie.find(1)).to(beUndefined);
      expect(trie.find(function() {})).to(beUndefined);
      expect(trie.find(null)).to(beUndefined);
      expect(trie.find(undefined)).to(beUndefined);
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
      trie.add('test', 'word');
      trie.add('testing', 'another word');
    })

    it('they exist in the trie in insert order', function (){
      expect(trie.find('test')).to(equal, ['word', 'another word']);
    });
  });

  /**
  * @description test removing identical words
  */
  describe('and removing identical words', function() {

    before(function() {
      trie.add('double', 'word');
      trie.add('double', 'another word');
    });

    it('they are returned when removed', function() {
      expect(trie.remove('double')).to(equal, ['word', 'another word']);
    });
    it('they are not in the trie', function() {
      trie.remove('double');
      expect(trie.find('d')).to(beUndefined);
    });
    it('they are not contained in the trie', function() {
      trie.remove('double');
      expect(trie.contains('double')).to(be, false);
    });
  });

  /**
  * @description test adding identical words
  */
  describe('and adding identical words', function() {

    before(function() {
      trie.add('one', 'word');
      trie.add('one', 'another word');
    });

    it('they exist in the trie in insert order', function() {
      expect(trie.find('one')).to(equal, ['word', 'another word']);
    });
  });

  /**
  * @description test adding identical words all the way to the last letter
  */
  describe('and adding two exact same words (different data) with all prefix letters stored', function() {

    before(function() {
      trie.add('o', 'word one');
      trie.add('on', 'word two');
      trie.add('one', 'word three');
      trie.add('one', 'word four');
    });

    it('they exist in the trie', function () {
      expect(trie.find('one')).to(equal, ['word three', 'word four']);
    });
  });


  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and adding a word with capitals', function() {

    before(function() {
      trie.add('Test', 'word');
    })

    it('it can be found in the trie', function (){
      expect(trie.find('test')).to(equal, ['word']);
    });
    it('it can be found in the trie with capitals', function (){
      expect(trie.find('Test')).to(equal, ['word']);
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

    it('it only returns the max number of results in insert order', function (){
      expect(trie.find('t')).to(
        equal
        , ['one','two','three','four','five','six','seven','eight','nine','ten']);
    });
  });
});

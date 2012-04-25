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
      expect(trie.find('testt')).to(beUndefined);
    });

    it('it is not found when using non string prefix', function (){
      expect(trie.find(true)).to(beUndefined);
      expect(trie.find(1)).to(beUndefined);
      expect(trie.find(function() {})).to(beUndefined);
      expect(trie.find(null)).to(beUndefined);
      expect(trie.find(undefined)).to(beUndefined);
    });

    it('it can be found using contains', function() {
      expect(trie.contains('test')).to(be, true);
      expect(trie.contains('t')).to(be, false);
    });

    /**
    * @description test removing a single word
    */
    describe('and removing the word', function() {

      before(function() {
        trie.remove('test');
      });

      it('it is not in the trie', function() {
        expect(trie.find('t')).to(beUndefined);
        expect(trie.find('test')).to(beUndefined);
      });

      it('it cannot be found using contains', function() {
        expect(trie.contains('test')).to(be, false);
        expect(trie.contains('t')).to(be, false);
      });
    });

    /**
    * @description test removing a word not in the trie
    */
    describe('and removing a non existent word', function() {
      
      it('it is still in the trie', function() {
        trie.remove('te');
        expect(trie.find('t')).to(equal, ['word']);
      });
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
  * @description test for adding words as a single argument
  */
  describe('and adding a word without data', function() {

    before(function() {
      trie.add('word');
    })

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
    })

    it('they exist in the trie', function (){
      expect(trie.find('test')).to(equal, ['another word', 'word']);
    });

    it('they are found using contains', function (){
      expect(trie.contains('test')).to(be, true);
      expect(trie.contains('testing')).to(be, true);
      expect(trie.contains('tes')).to(be, false);
      expect(trie.contains('testi')).to(be, false);
    });

    /**
    * @description test removing a word
    */
    describe('and removing one word', function() {

      it('it no longer exists', function() {
        trie.remove('test');
        expect(trie.find('tes')).to(equal, ['another word']);
        expect(trie.find('test')).to(equal, ['another word']);
        expect(trie.find('testi')).to(equal, ['another word']);
      });
    });

    /**
    * @description test removing a word
    */
    describe('and removing the other word', function() {

      it('it no longer exists', function() {
        trie.remove('testing');
        expect(trie.find('tes')).to(equal, ['word']);
        expect(trie.find('test')).to(equal, ['word']);
        expect(trie.find('testi')).to(beUndefined);
      });
    });
  });

  /**
  * @description test adding multiple words
  */
  describe('and adding two words', function() {

    before(function() {
      trie.add('abc', 'another word');
      trie.add('ab', 'word');
    })

    it('they exist in the trie', function (){
      expect(trie.find('a')).to(equal, ['another word', 'word']);
    });
  });

  /**
  * @description test adding indentical words
  */
  describe('and adding two identical words', function() {
    before(function() {
      trie.add('one', 'word');
      trie.add('one', 'another word');
    });

    it('they exist in the trie', function() {
      expect(trie.find('o')).to(equal, ['another word', 'word']);
      expect(trie.find('onee')).to(beUndefined);
    });
  });

  /**
  * @description test removing indentical words
  */
  describe('and removing two identical words', function() {

    before(function() {
      trie.add('one', 'word');
      trie.add('one', 'another word');
    });

    it('they are both returned', function() {
      expect(trie.remove('one')).to(equal, ['another word', 'word']);
    });
    it('they are both removed', function() {
      trie.remove('one');
      expect(trie.find('o')).to(beUndefined);
    });
    it('they are not contained', function() {
      trie.remove('one');
      expect(trie.contains('one')).to(be, false);
    });
  });

  /**
  * @description test adding identical words all the way to the last letter
  */
  describe('and adding two exact same words (different data) with all prefix letters stored', function() {

    before(function() {
      trie.add('o', 'word one');
      trie.add('on', 'word two');
      trie.add('one', 'word b');
      trie.add('one', 'word a');
    });

    it('they exist in the trie', function () {
      expect(trie.find('one')).to(equal, ['word a', 'word b']);
    });
  });

  /**
  * @description test adding three indentical words
  */
  describe('and adding three identical words', function() {
    before(function() {
      trie.add('one', 'word');
      trie.add('one', 'another word');
      trie.add('one', 'third word');
    });

    it('they exist in the trie', function() {
      expect(trie.find('o')).to(equal, ['another word', 'third word', 'word']);
      expect(trie.find('onee')).to(beUndefined);
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
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and modifying an added word', function() {

    before(function() {
      trie.add('test', 'word');
    })

    it('it does not modify the word in the tree', function (){
      var words = trie.find('test');
      words[0] = 'new';
      expect(trie.find('test')).to(equal, ['word']);
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
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
  * @description test uppercase letters in words and with prefix fetching
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

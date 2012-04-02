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
      trie.add('test', {name: 'word'});
    })

    it('it exists in the trie', function (){
      expect(trie.find('test')).to(equal, [{name: 'word'}]);
    });

    it('it can be retrieved by prefix', function (){
      expect(trie.find('t')).to(equal, [{name: 'word'}]);
      expect(trie.find('te')).to(equal, [{name: 'word'}]);
      expect(trie.find('tes')).to(equal, [{name: 'word'}]);
    });

    it('it is not found when using incorrect prefix', function (){
      expect(trie.find('wrong')).toNot(equal, [{name: 'word'}]);
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
      trie.add(1, {name: 'word'});
      trie.add(false, {name: 'word'});
      trie.add(function() {}, {name: 'word'});
      trie.add(null, {name: 'word'});
      trie.add(undefined, {name: 'word'});
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
      trie.add('test', {name: 'word'});
      trie.add('testing', {name: 'another word'});
      trie.add('testi', {name: 'bob'})
    })

    it('they exist in the trie', function (){
      expect(trie.find('test')).to(equal, [{name: 'another word'}, {name: 'bob'}, {name: 'word'}]);
    });
  });

  /**
  * @description test adding identical words
  */
  describe('and adding two identical words', function() {

    before(function() {
      trie.add('one', {name: 'word'});
      trie.add('one', {name: 'another word'});
    });

    it('they exist in the trie', function() {
      expect(trie.find('o')).to(equal, [{name: 'another word'}, {name: 'word'}]);
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and adding a word with capitals', function() {

    before(function() {
      trie.add('Test', {name: 'word'});
    })

    it('it can be found in the trie', function (){
      expect(trie.find('test')).to(equal, [{name: 'word'}]);
    });
    it('it can be found in the trie with capitals', function (){
      expect(trie.find('Test')).to(equal, [{name: 'word'}]);
    });
  });

  /**
  * @description test object copying
  */
  describe('and modifying an added word', function() {

    before(function() {
      trie.add('test', {name: 'word'});
    })

    it('it does not modify the word in the tree', function (){
      var words = trie.find('test');
      words[0] = 'new';
      expect(trie.find('test')).to(equal, [{name: 'word'}]);
    });
  });

  /**
  * @description test adding sub word
  */
  describe('and adding a sub word', function() {

    before(function() {
      trie.add('test word', {name: 'word'});
      trie.add('test', {name: 'test'});
    })

    it('it doesnt throw errors', function (){
      expect(trie.find('test')).to(equal, [{name: 'test'}, {name: 'word'}]);
    });
  });

  /**
  * @description test returning results over the max cache amount
  */
  describe('and adding more words than the cache', function() {

    before(function() {
      trie.add('testone', {name: 'one'});
      trie.add('testtwo', {name: 'two'});
      trie.add('testthree', {name: 'three'});
      trie.add('testfour', {name: 'four'});
      trie.add('testfive', {name: 'five'});
      trie.add('testsix', {name: 'six'});
      trie.add('testseven', {name: 'seven'});
      trie.add('testeight', {name: 'eight'});
      trie.add('testnine', {name: 'nine'});
      trie.add('testten', {name: 'ten'});
      trie.add('testeleven', {name: 'eleven'});
    })

    it('it only returns the max number of results', function (){
      expect(trie.find('t')).to(equal,
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

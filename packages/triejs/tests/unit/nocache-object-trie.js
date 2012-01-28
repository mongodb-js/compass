foounit.require(':vendor/spec-helper');
var Triejs = foounit.require(':src/trie');

/**
* @description Test the cache disabled trie data implementation with
*   data only stored at the suffix level
*/
describe('When using a trie with no cache', function (){
  var trie;

  before(function (){
    trie = new Triejs({
      enableCache: false
      , insert: function(target, data) {
        if (!target[data.type]) {
          target[data.type] = [data];
        } else {
          for (var i = 0, ii = target[data.type].length; i < ii; i++) {
            if (target[data.type].id == data.id) {
              return target;
            }
          }
          target[data.type].push(data);
        }
        return target;
      }
      , sort: function() {
        for (var type in this) {
          this[type].sort(function(a, b) { return a.position - b.position; });
        }
      }
      , copy: function(data) {
        var temp = {};
        for (var type in data) {
          temp[type] = data[type].slice();
        }
        return temp;
      }
      , clip: function(max) {
        for (var type in this) {
          this[type].splice(max, this[type].length - max);
        }
      }
      , merge: function(target, data) {
        for (var type in data) {
          for (var i = 0, ii = data[type].length; i < ii; i++) {
            target = this.options.insert.call(this, target, data[type][i]);
            this.options.sort.call(target);
            this.options.clip.call(target, this.options.maxCache);
          }
        }
        return target;
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
      trie.add('test', {type:'person', name:'Test', position: 0});
    })

    it('it exists in the trie', function (){
      expect(trie.find('test')).to(equal, {'person': [{type:'person', name:'Test', position: 0}]});
    });

    it('it can be retrieved by prefix', function (){
      expect(trie.find('t')).to(equal, {'person': [{type:'person', name:'Test', position: 0}]});
      expect(trie.find('te')).to(equal, {'person': [{type:'person', name:'Test', position: 0}]});
      expect(trie.find('tes')).to(equal, {'person': [{type:'person', name:'Test', position: 0}]});
    });

    it('it is not found when using incorrect prefix', function (){
      expect(trie.find('wrong')).toNot(equal, {'person': [{type:'person', name:'Test', position: 0}]});
      expect(trie.find('wrong')).to(beUndefined);
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
        expect(trie.find('t')).to(equal, {'person': [{type:'person', name:'Test', position: 0}]});
      });
    });
  });

  /**
  * @description test for invalid input to add function
  */
  describe('and adding a non string word', function() {

    before(function() {
      trie.add(1, {type:'person', name:'Test', position: 0});
      trie.add(false, {type:'person', name:'Test', position: 0});
      trie.add(function() {}, {type:'person', name:'Test', position: 0});
      trie.add(null, {type:'person', name:'Test', position: 0});
      trie.add(undefined, {type:'person', name:'Test', position: 0});
    })

    it('it adds nothing to the trie', function (){
      expect(trie.root).to(equal, {});
    });
  });

  /**
  * @description test adding multiple words
  */
  describe('and adding two similar words (first smaller)', function() {

    before(function() {
      trie.add('test', {type:'person', name:'Test', position: 1, id: 0});
      trie.add('testing', {type:'person', name:'More', position: 2, id: 1});
    })

    it('they exist in the trie', function (){
      expect(trie.find('test')).to(equal, {
        'person': [
          {type:'person', name:'Test', position: 1, id: 0}
          ,{type:'person', name:'More', position: 2, id: 1}]
      });
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
        expect(trie.find('tes')).to(equal, {'person': [{type:'person', name:'More', position: 2, id: 1}]});
        expect(trie.find('test')).to(equal, {'person': [{type:'person', name:'More', position: 2, id: 1}]});
        expect(trie.find('testi')).to(equal, {'person': [{type:'person', name:'More', position: 2, id: 1}]});
      });
    });

    /**
    * @description test removing a word
    */
    describe('and removing the other word', function() {

      it('it no longer exists', function() {
        trie.remove('testing');
        expect(trie.find('tes')).to(equal, {'person': [{type:'person', name:'Test', position: 1, id: 0}]});
        expect(trie.find('test')).to(equal, {'person': [{type:'person', name:'Test', position: 1, id: 0}]});
        expect(trie.find('testi')).to(beUndefined);
      });
    });
  });

  /**
  * @description test adding multiple words
  */
  describe('and adding two similar words (second smaller)', function() {

    before(function() {
      trie.add('abc', {type:'person', name:'First', position: 2, id: 0});
      trie.add('ab', {type:'person', name:'Second', position: 1, id: 1});
    })

    it('they exist in the trie', function (){
      expect(trie.find('a')).to(equal, {
        person: [
          {type:'person', name:'Second', position: 1, id: 1}
          , {type:'person', name:'First', position: 2, id: 0}
        ]
      });
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and adding a word with capitals', function() {

    before(function() {
      trie.add('Test', {type:'person', name:'First', position: 2, id: 0});
    })

    it('it can be found in the trie', function (){
      expect(trie.find('test')).to(equal, {person: [{type:'person', name:'First', position: 2, id: 0}]});
    });
    it('it can be found in the trie with capitals', function (){
      expect(trie.find('Test')).to(equal, {person: [{type:'person', name:'First', position: 2, id: 0}]});
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and modifying an added word', function() {

    before(function() {
      trie.add('test', {type:'person', name:'First', position: 2, id: 0});
    })

    it('it does not modify the word in the tree', function (){
      var words = trie.find('test');
      words.person[0] = {type:'person', name:'Stuff', position: 3, id: 1};
      expect(trie.find('test')).to(equal, {person: [{type:'person', name:'First', position: 2, id: 0}]});
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and adding a word with unicode characters', function() {

    before(function() {
      trie.add('test\u0B9x\u0D9x\u091x', {type:'person', name:'First', position: 2, id: 0});
    })

    it('it is found in the trie', function (){
      expect(trie.find('test\u0B9x')).to(equal, {person: [{type:'person', name:'First', position: 2, id: 0}]});
    });
  });

  /**
  * @description test uppercase letters in words and with prefix fetching
  */
  describe('and adding a word with unicode characters and splitting on unicode chars', function() {

    before(function() {
      trie.add('test\u0B9x\u0D9x\u091x', {type:'person', name:'First', position: 2, id: 0});
      trie.add('test\u0B9x\u0D9x', {type:'person', name:'Second', position: 3, id: 1});
    })

    it('it is found in the trie', function (){
      expect(trie.find('test\u0B9x')).to(equal, {
        person: [
          {type:'person', name:'First', position: 2, id: 0}
          , {type:'person', name:'Second', position: 3, id: 1}
        ]
      });
    });
  });

  /**
  * @description test returning results over the max cache amount
  */
  describe('and adding more words than the cache', function() {

    before(function() {
      trie.add('testone',    {type:'person', name:'one',    position: 1, id: 0});
      trie.add('testtwo',    {type:'person', name:'two',    position: 2, id: 1});
      trie.add('testthree',  {type:'person', name:'three',  position: 3, id: 2});
      trie.add('testfour',   {type:'person', name:'four',   position: 4, id: 3});
      trie.add('testfive',   {type:'person', name:'five',   position: 5, id: 4});
      trie.add('testsix',    {type:'person', name:'six',    position: 6, id: 5});
      trie.add('testseven',  {type:'person', name:'seven',  position: 7, id: 6});
      trie.add('testeight',  {type:'person', name:'eight',  position: 8, id: 7});
      trie.add('testnine',   {type:'person', name:'nine',   position: 9, id: 8});
      trie.add('testten',    {type:'person', name:'ten',    position: 10, id: 9});
      trie.add('testeleven', {type:'person', name:'eleven', position: 11, id: 10});
    })

    it('it only returns the max number of results', function (){
      expect(trie.find('t')).to(equal, {
        person: [
          {type:'person', name:'one',    position: 1, id: 0}
          , {type:'person', name:'two',    position: 2, id: 1}
          , {type:'person', name:'three',  position: 3, id: 2}
          , {type:'person', name:'four',   position: 4, id: 3}
          , {type:'person', name:'five',   position: 5, id: 4}
          , {type:'person', name:'six',    position: 6, id: 5}
          , {type:'person', name:'seven',  position: 7, id: 6}
          , {type:'person', name:'eight',  position: 8, id: 7}
          , {type:'person', name:'nine',   position: 9, id: 8}
          , {type:'person', name:'ten',    position: 10, id: 9}
        ]
      })
    });
  });
});

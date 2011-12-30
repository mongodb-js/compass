importScripts('../../src/trie.js', '../dict.js');

/**
* @description calculate the approximate size of an object in memory
*/
function approxSize(object) {
  var size = 0
    , pieces = [object]
    , piece;

  while (piece = pieces.pop()) {
    switch(typeof piece) {
      case 'boolean':
        size += 4;
        break;
      case 'string':
        size += piece.length * 2;
        break;
      case 'number':
        size += 8;
      case 'object':
        size += 8; // assumed object overhead...hacky
        for (var obj in piece) {
          pieces.push(piece[obj]);
        }
        break;
    }
  }
  return size;
}

self.addEventListener('message', function(e) {

  var step = e.data
    , trieSimple = new Triejs({ enableCache: false })
    , trieComplex = new Triejs({ enableCache: false })
    , Hash = function() { this.root = {}; }
    , hashSimple = new Hash()
    , hashComplex = new Hash()
    , length = Math.round(dictionary.length / step)
    , t1, t2, t3, t4, t5, t6, t7, t8
    , trie1, trie2, trie3, trie4, hash1, hash2, hash3, hash4
    , size1, size2, size3, size4;

  // No cache basic trie insert
  //////////////////////////////
  t1 = new Date();
  for (var i = 0, ii = dictionary.length; i < ii; i += step) {
    trieSimple.add(dictionary[i]);
  }
  t2 = new Date();
  trie1 = 1000*((t2.getTime() - t1.getTime()) / length);

  // No Cache simple trie lookup
  ///////////////////////////////
  t1 = new Date();
  for (var i = 0, ii = dictionary.length; i < ii; i += step) {
    trieSimple.find(dictionary[i]);
  }
  t2 = new Date();
  trie3 = 1000*((t2.getTime() - t1.getTime()) / length);

  // No cache complex trie insert
  ////////////////////////////////
  t1 = new Date();
  for (var i = 0, ii = dictionary.length; i < ii; i += step) {
    trieComplex.add(
      dictionary[i]
      , { test:'data', more:'data', yetmore: 'data', name: dictionary[i] }
    );
  }
  t2 = new Date();
  trie2 = 1000*((t2.getTime() - t1.getTime()) / length);

  // No Cache complex trie lookup
  ////////////////////////
  t1 = new Date();
  for (var i = 0, ii = dictionary.length; i < ii; i += step) {
    trieComplex.find(dictionary[i]);
  }
  t2 = new Date();
  trie4 = 1000*((t2.getTime() - t1.getTime()) / length);

  size1 = approxSize(trieSimple.root);
  size2 = approxSize(trieComplex.root);
  delete trieSimple.root;
  delete trieComplex.root;

  // Simple hash insert
  //////////////////////
  t1 = new Date();
  for (var i = 0, ii = dictionary.length; i < ii; i += step) {
    var tempword = dictionary[i];
    for (var j = 0, jj = tempword.length+1; j < jj; j++) {
      var prefix = tempword.substring(0, j);
      if (hashSimple.root[prefix]) {
        hashSimple.root[prefix].push(dictionary[i]);
      } else if (!hashSimple.root[prefix]){
        hashSimple.root[prefix] = [dictionary[i]];
      }
    }
  }
  t2 = new Date();
  hash1 = 1000*((t2.getTime() - t1.getTime()) / length);

  // Simple hash lookup
  ////////////////////////////////
  t1 = new Date();
  for (var i = 0, ii = dictionary.length; i < ii; i += step) {
    hashSimple.root[dictionary[i]].slice(0);
  }
  t2 = new Date();
  hash3 = 1000*((t2.getTime() - t1.getTime()) / length);
  size3 = approxSize(hashSimple.root);
  delete hashSimple.root;

  // Complex hash insert
  ///////////////////////
  t1 = new Date();
  for (var i = 0, ii = dictionary.length; i < ii; i += step) {
    var tempword = dictionary[i];
    for (var j = 0, jj = tempword.length+1; j < jj; j++) {
      var prefix = tempword.substring(0, j);
      if (hashComplex.root[prefix]) {
        hashComplex.root[prefix].push(
          { test:'data', more:'data', yetmore: 'data', name: dictionary[i] }
        );
      } else if (!hashComplex.root[prefix]){
        hashComplex.root[prefix] = [{ test: 'data', more: 'data', yetmore: 'data', name: dictionary[i] }];
      }
    }
  }
  t2 = new Date();
  hash2 = 1000*((t2.getTime() - t1.getTime()) / length);

  // Complex hash lookup
  ////////////////////////////////
  t1 = new Date();
  for (var i = 0, ii = dictionary.length; i < ii; i += step) {
    hashComplex.root[dictionary[i]].slice(0);
  }
  t2 = new Date();
  hash4 = 1000*((t2.getTime() - t1.getTime()) / length);
  size4 = approxSize(hashComplex.root);
  delete hashComplex.root;

  trie1 = Math.round(trie1*10)/10;
  trie2 = Math.round(trie2*10)/10;
  trie3 = Math.round(trie3*10)/10;
  trie4 = Math.round(trie4*10)/10;
  hash1 = Math.round(hash1*10)/10;
  hash2 = Math.round(hash2*10)/10;
  hash3 = Math.round(hash3*10)/10;
  hash4 = Math.round(hash4*10)/10;

  postMessage({
    'trie1': trie1
    , 'trie2': trie2
    , 'trie3': trie3
    , 'trie4': trie4
    , 'hash1': hash1
    , 'hash2': hash2
    , 'hash3': hash3
    , 'hash4': hash4
    , 'size1': size1
    , 'size2': size2
    , 'size3': size3
    , 'size4': size4
  });
}, false);
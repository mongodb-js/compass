# mongodb-security [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Portable business logic of MongoDB security model, mostly string formatting.

## example

```mocha-should
var security = require('mongodb-security');

security.humanize({cluster: true})
.should.equal('For the deployment');

security.humanize({collection: 'users', db: 'mscope'})
.should.equal('On mscope.users');

security.humanize({collection: '', db: 'mscope'})
.should.equal('On any any collection in the mscope database');

security.humanize({collection: 'users', db: ''})
.should.equal('On the users collection in any database');
```

## api

### `security.humanize(:resource)`

Take the `:resource` of a MongoDB grant and hand back a literate sentence prefix.

## todo

- [ ] tests
- [ ] move jade mixins currently in scope over hear
- [ ] use [@imlucas/mongodb-ns](http://github.com/imlucas/mongodb-ns)

[travis_img]: https://img.shields.io/travis/mongodb-js/security.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/security
[npm_img]: https://img.shields.io/npm/v/mongodb-security.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mongodb-security

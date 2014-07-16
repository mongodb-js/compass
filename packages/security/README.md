# mongodb-security

> WIP

[![build status](https://secure.travis-ci.org/imlucas/mongodb-security.png)](http://travis-ci.org/imlucas/mongodb-security)

Portable business logic of MongoDB security model, mostly string formatting.

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

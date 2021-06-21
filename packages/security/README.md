# mongodb-security [![npm][npm_img]][npm_url]

> Portable business logic of MongoDB security model, mostly string formatting.

## Usage

``` js
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

## Example

``` js
var MongoClient = require('mongodb').MongoClient;
var security = require('../');
var format = require('util').format;

var username = 'reportsUser';
var password = 'foo';
var authDB = 'reporting';

var url = 'mongodb://localhost:30000/%s';

MongoClient.connect(format(url, authDB), function(err, db) {
    if (err) {
        throw err;
    }

    // log in as that user
    db.authenticate(username, password, function(err, res) {
    // get the user info with privileges
        db.command({
            usersInfo: {
                user: username,
                db: authDB
            },
            showPrivileges: true
        }, function(err, res) {
            if (err) {
                throw err;
            }

            var user = res.users[0];
            console.log(JSON.stringify(user, null, 2));

            // check if user has listDatabases privilege with cluster resource
            var listDatabasesAllowed = security.getResourcesWithActions(
                user, ['listDatabases']).length === 1;

            // if allowed, run listDatabases command, if not, set to [].

            // merge with databases from user info on which the user is allowed to
            // call listCollections
            var databases = security.getResourcesWithActions(
                user, ['listCollections'], 'database').map(function(resource) {
                return resource.db;
            });

            console.log('user can run listCollections on:', databases);

            // run listCollections on all databases, gather all namespaces

            // add required privilege actions here
            // @see https://docs.mongodb.org/manual/reference/privilege-actions/
            var compassActions = ['find', 'collStats'];

            // combine namespaces with ones that user has find+collStats privilege
            var namespaces = security.getResourcesWithActions(
                user, compassActions, 'collection').map(function(resource) {
                return resource.db + '.' + resource.collection;
            });

            console.log('user can run find + collStats on:', namespaces);

            db.close();
        });
    });
});
```

## api

### `security.humanize(:resource)`

Take the `:resource` of a MongoDB grant and hand back a literate sentence prefix.

## todo

- [ ] tests
- [ ] move jade mixins currently in scope over hear
- [ ] use [@imlucas/mongodb-ns](http://github.com/imlucas/mongodb-ns)

[npm_img]: https://img.shields.io/npm/v/mongodb-security.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mongodb-security

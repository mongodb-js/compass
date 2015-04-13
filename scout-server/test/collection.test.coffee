{setup, teardown, GET, DELETE, POST} = require './helper'

assert = require 'assert'
debug = require('debug') 'scout-server:test:collection'

describe 'Collection', ->
  before (done) ->
    setup (err) ->
      return done(err) if err?
      DELETE '/api/v1/localhost:27017/collections/test.scopes'
        .end  (err, res) -> done(err, res)

  after (done) ->
    DELETE '/api/v1/localhost:27017/collections/test.scopes'
      .end  (err, res) ->
        return done(err) if err?
        teardown(done)

  it 'should not create collections automatically', (done) ->
    GET '/api/v1/localhost:27017/collections/test.scopes'
      .expect 404
      .end  (err, res) -> done err, res.body

  it 'should return collection details', (done) ->
    POST('/api/v1/localhost:27017/collections/test.scopes')
      .expect 201
      .end (err, res) ->
        return done(err) if err?

        GET '/api/v1/localhost:27017/collections/test.scopes'
          .expect 200
          .end (err, res) -> done err, res.body

  it.skip 'should be able to run find', (done) ->
    get '/api/v1/localhost:27017/collections/test.scopes/find'
      .expect 200
      .end (err, res) ->
        return done err if err
        assert res.body.length is 1, 'should have got the dummy insert'
        done()

  it.skip 'should be able to run count', (done) ->
    get '/localhost:27017/collections/test.scopes/count'
      .expect 200
      .end (err, res) ->
        return done err if err
        assert res.body.count is 1, 'should have got the dummy insert'
        done()

  it.skip 'should be able to run find with explain', (done) ->
    get '/localhost:27017/collections/test.scopes/find'
      .query {explain: 1}
      .expect 200
      .end (err, res) ->
        return done err if err
        assert res.body.cursor is 'BasicCursor'
        done()

  it.skip 'should be able to run aggregate', (done) ->
    pipeline = JSON.stringify [{$group: {_id: '$_id'}}]
    get '/localhost:27017/collections/test.scopes/aggregate'
      .query {pipeline: pipeline}
      .expect 200
      .end (err, res) ->
        return done err if err
        assert res.body.length is 1
        done()

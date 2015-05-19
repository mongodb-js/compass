process.env.NODE_ENV = 'testing'

supertest = require 'supertest'
connect = require 'mongodb'
assert = require 'assert'
app = require '../'
brain = require '../../scout-brain'
debug = require('debug') 'scout-server:test:helper'

defaults =
  seed: 'mongodb://localhost:27017'

ctx =
  get: (key) ->
    ctx[key] || defaults[key]

  reset: () ->
    Object.keys(ctx).map (k) ->
      delete ctx[k] if(typeof ctx[k] != 'function')
    return ctx

GET = (path) ->
  debug 'GET %s', path
  req = supertest(app).get(path).accept('json')
  if ctx.token
    req.set 'Authorization', "Bearer #{ctx.token}"

  return req

POST = (path) ->
  debug 'POST %s', path
  req = supertest(app).post(path).accept('json')
  if ctx.token
    req.set 'Authorization', "Bearer #{ctx.token}"

  return req

DELETE = (path) ->
  debug 'DELETE %s', path
  req = supertest(app).del(path).accept('json')
  if ctx.token
    req.set 'Authorization', "Bearer #{ctx.token}"

  return req

PUT = (path) ->
  debug 'PUT %s', path
  req = supertest(app).put(path).accept('json')
  if ctx.token
    req.set 'Authorization', "Bearer #{ctx.token}"

  return req

module.exports =
  collections: {}
  GET: GET
  POST: POST
  DELETE: DELETE
  PUT: PUT

  beforeWith: (context) ->
    return (done) ->
      Object.keys(context).map (k) ->
        ctx[k] = context[k]

      module.exports.before(done)

  before: (done) ->
    debug 'running setup'
    payload = {seed: ctx.get('seed')}

    debug 'getting token for payload %j', payload
    POST '/api/v1/token'
      .send payload
      .expect 201
      .expect 'Content-Type', /json/
      .end (err, res) ->
        return done(err) if err?

        assert res.body.token

        ctx.token = res.body.token
        module.exports.token = res.body.token
        debug 'set token to', module.exports.token
        debug 'setup complete'
        debug ''
        debug ''
        done()

  token: () ->
    ctx.token

  after: (done) ->
    debug ''
    debug ''
    debug 'tearing down'

    supertest app
      .del '/api/v1/token'
      .accept 'json'
      .set 'Authorization', 'Bearer ' + ctx.token
      .expect 200
      .end (err)->
        return done(err) if err?

        ctx.reset()
        brain.clearStore(done)

module.exports.setup = module.exports.before
module.exports.teardown = module.exports.after

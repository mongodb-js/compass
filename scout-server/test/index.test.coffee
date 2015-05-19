assert = require 'assert'
{setup, teardown, GET} = require './helper'
debug = require('debug') 'scout-server:test:index'

describe '/', ->
  before setup
  after teardown

  it 'should redirect to the root of the current version', (done) ->
    GET '/api'
      .expect 302
      .end done

  it 'should have a discoverable root', (done) ->
    GET '/api/v1'
      .expect 200
      .end done

  it 'should have a health-check', (done) ->
    GET '/health-check'
      .expect 200
      .end done

var assert = require('chai').assert
  , sinon = require('sinon')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , amqp = require('amqplib')
  , connectionFactory = require('../lib/connectionFactory')

var fn = function() { };
var p = function(v) {
  return new Promise(function(f) { f(v); });
}

var sandbox;

suite('connectionFactory', function() {

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  test('get returns connection promise', function(done) {
    var connectStub = sandbox.stub(amqp, 'connect').returns(p({on:fn}));

    var host = 'amqp://localhost';

    var connFactory = connectionFactory.create(host, {});

    connFactory.get().then(function() {
      assert(connectStub.calledWith(host));
      done();
    });
  });

  test('retries specified number of times', function(done) {
    sandbox.spy(Promise, 'delay');
    var connectStub = sandbox.stub(amqp, 'connect', function() {
      return Promise.reject({ code: 'ECONNREFUSED' });
    });

    var host = 'amqp://localhost';
    var options = {
      connectRetries: 10,
      connectRetryInterval: 1
    }
    var connFactory = connectionFactory.create(host, options);

    connFactory.get().catch(function(err) {
      assert(Promise.delay.calledWithExactly(options.connectRetryInterval));
      assert.equal(connectStub.callCount, options.connectRetries);
      done();
    });
  });

})
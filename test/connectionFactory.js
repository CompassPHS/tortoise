var assert = require('chai').assert
  , sinon = require('sinon')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , amqp = require('amqplib')
  , connectionFactory = require('../lib/connectionFactory')
  , events = require('../lib/events');

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

  test('get returns preexisting connection promise', function(done) {
    var connectStub = sandbox.stub(amqp, 'connect').returns(p({on:fn}));

    var host = 'amqp://localhost';

    var connFactory = connectionFactory.create(host, {});

    connFactory.get().then(function() {
      connFactory.get().then(function() {
        assert(connectStub.calledWith(host));
        assert.equal(connectStub.callCount, 1);
        done();
      });
    });
  });

  test('get retries specified number of times', function(done) {
    sandbox.spy(Promise, 'delay');
    var connectStub = sandbox.stub(amqp, 'connect', function() {
      return Promise.reject({ code: 'ECONNREFUSED' });
    });

    var emitter = sinon.stub({ emit: function() { } });

    var host = 'amqp://localhost';
    var options = {
      connectRetries: 10,
      connectRetryInterval: 1
    }
    var connFactory = connectionFactory.create(host, options, emitter);

    connFactory.get().catch(function(err) {
      assert(Promise.delay.calledWithExactly(options.connectRetryInterval));
      assert.equal(connectStub.callCount, options.connectRetries);
      done();
    });
  });

  test('get emits error events when they occur', function(done) {

    var emittedEvent = [];

    var emitter = {
      emit: function(eventName, data) {
        emittedEvent = [eventName, data];
      }
    }

    var bind = function(eventName, handler) {
      if(eventName === 'close') {
        handler();
        assert.equal(emittedEvent[0], events.CONNECTIONCLOSED);
        assert.equal(emittedEvent[1], undefined);
      }

      if(eventName === 'error') {
        var error1 = { code: 'ECONNRESET'}
        handler(error1);
        assert.equal(emittedEvent[0], events.CONNECTIONDISCONNECTED);
        assert.equal(emittedEvent[1], error1);

        var error2 = { code: 'SOMETHINGELSE'}
        handler(error2);
        assert.equal(emittedEvent[0], events.CONNECTIONERROR);
        assert.equal(emittedEvent[1], error2);
      }
    }

    var connectStub = sandbox.stub(amqp, 'connect').returns(p({on:bind}));

    var host = 'amqp://localhost';

    var connFactory = connectionFactory.create(host, {}, emitter);

    connFactory.get().then(function() {
      done();
    });
  });

})
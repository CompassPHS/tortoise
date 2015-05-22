var assert = require('chai').assert
  , sinon = require('sinon')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , amqp = require('amqplib')
  , exchange = require('../lib/exchange')
  , queue = require('../lib/queue')
  , Tortoise = require('../lib/tortoise');

var fn = function() { };
var p = function(v) {
  return new Promise(function(f) { f(v); });
}

var sandbox;

function build() {

  var conn = { close: fn, createChannel: fn }
  var ch = { };

  // Default stubbing behavior
  var closeStub = sandbox.spy(conn, 'close');
  var connectStub = sandbox.stub(amqp, 'connect').returns(p(conn));
  sandbox.stub(conn, 'createChannel').returns(p(ch));

  return {
    amqp: {
      connect: connectStub
    },
    conn: {
      close: closeStub
    }
  }
}

suite('Tortoise', function() {

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  test('tortoise initiates connection', function() {
    var stubs = build();
    var host = 'amqp://localhost';
    var tortoise = new Tortoise(host);
    assert(stubs.amqp.connect.calledWith(host));
  });

  test('destroy closses connection', function(done) {
    var stubs = build();
    var tortoise = new Tortoise('amqp://localhost');
    tortoise.destroy().then(function() {
      assert(stubs.conn.close.calledOnce);
      done();
    });
  });

  test('exchange creates and configures exchange', function(done) {
    var stubs = build();

    var ex = { configure: fn }
    var createStub = sandbox.stub(exchange, 'create').returns(ex);
    var configureStub = sandbox.stub(ex, 'configure').returns(ex);

    var tortoise = new Tortoise('amqp://localhost');

    tortoise.exchange('my-exchange', 'topic', { durable: true });

    assert(createStub.calledOnce);
    assert(configureStub.calledWith('my-exchange', 'topic', { durable: true }));

    createStub.args[0][0]().then(function(ch) {
      assert.isTrue(_.isObject(ch))
      done();
    });
  });

  test('queue creates and configures queue', function(done) {
    var stubs = build();

    var q = { configure: fn }
    var createStub = sandbox.stub(queue, 'create').returns(q);
    var configureStub = sandbox.stub(q, 'configure').returns(q);

    var tortoise = new Tortoise('amqp://localhost');

    tortoise.queue('my-queue', { durable: true });

    assert(createStub.calledOnce);
    assert(configureStub.calledWith('my-queue', { durable: true }));

    createStub.args[0][0]().then(function(ch) {
      assert.isTrue(_.isObject(ch))
      done();
    });
  });

})
var assert = require('chai').assert
  , sinon = require('sinon')
  , Promise = require('bluebird')
  , amqp = require('amqplib')
  , exchange = require('../lib/exchange')
  , queue = require('../lib/queue')
  , Tortoise = require('../lib/tortoise');

var emptyFn = function() { };
var quickPromise = function(returnValue) {
  return new Promise(function(f) { f(returnValue); });
}

var sandbox;

function build() {

  var conn = { close: emptyFn }

  // Default stubbing behavior
  var closeStub = sandbox.spy(conn, 'close');
  var connectStub = sandbox.stub(amqp, 'connect').returns(quickPromise(conn));

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

  test('exchange creates and configures exchange', function() {
    var stubs = build();

    var ex = { configure: emptyFn }
    var createStub = sandbox.stub(exchange, 'create').returns(ex);
    var configureStub = sandbox.stub(ex, 'configure').returns(ex);

    var tortoise = new Tortoise('amqp://localhost');

    tortoise.exchange('my-exchange', 'topic', { durable: true });

    assert(createStub.calledOnce);
    assert(configureStub.calledWith('my-exchange', 'topic', { durable: true }));
  });

  test('queue creates and configures queue', function() {
    var stubs = build();

    var q = { configure: emptyFn }
    var createStub = sandbox.stub(queue, 'create').returns(q);
    var configureStub = sandbox.stub(q, 'configure').returns(q);

    var tortoise = new Tortoise('amqp://localhost');

    tortoise.queue('my-queue', { durable: true });

    assert(createStub.calledOnce);
    assert(configureStub.calledWith('my-queue', { durable: true }));
  });

})
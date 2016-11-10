var assert = require('chai').assert
  , sinon = require('sinon')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , exchange = require('../lib/exchange')
  , queue = require('../lib/queue')
  , channelFactory = require('../lib/channelFactory')
  , Tortoise = require('../lib/tortoise');

var fn = function() { };
var p = function(v) {
  return new Promise(function(f) { f(v); });
}

var sandbox;

function build() {

  var chFactory = { get: fn, close: fn }

  var createStub = sandbox.stub(channelFactory, 'create').returns(chFactory);
  var closeStub = sandbox.stub(chFactory, 'close').returns(p());
  var getStub = sandbox.stub(chFactory, 'get').returns(p({}));

  return {
    chFactory: {
      create: createStub,
      close: closeStub
    }
  }
}

suite('tortoise', function() {

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  test('tortoise creates channel factory', function() {
    var stubs = build();
    var host = 'amqp://localhost';
    var options = { setting: true };
    var tortoise = new Tortoise(host, options);
    assert(stubs.chFactory.create.calledWith(host, options));
  });

  test('destroy closes connection(s)', function(done) {
    var stubs = build();
    var tortoise = new Tortoise('amqp://localhost');
    tortoise.destroy().then(function() {
      assert(stubs.chFactory.close.calledOnce);
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

    createStub.args[0][0].get().then(function(ch) {
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

    createStub.args[0][0].get().then(function(ch) {
      assert.isTrue(_.isObject(ch))
      done();
    });
  });

})
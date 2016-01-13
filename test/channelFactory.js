var assert = require('chai').assert
  , sinon = require('sinon')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , connectionFactory = require('../lib/connectionFactory')
  , channelFactory = require('../lib/channelFactory');

var fn = function() { };
var p = function(v) {
  return new Promise(function(f) { f(v); });
}

var sandbox;

function build() {

  var conn = { close: fn, createChannel: fn }
  var connFactory = { get: fn }

  // Default stubbing behavior
  var createStub = sandbox.stub(connectionFactory, 'create').returns(connFactory);
  var getStub = sandbox.stub(connFactory, 'get').returns(p(conn));
  var closeStub = sandbox.spy(conn, 'close');
  var createChannelStub = sandbox.stub(conn, 'createChannel');

  return {
    connFactory: {
      create: createStub,
      getStub: getStub
    },
    conn: {
      close: closeStub,
      createChannel: createChannelStub
    }
  }
}

suite('channelFactory', function() {

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  test('channelFactory initiates connection', function() {
    var stubs = build();
    var host = 'amqp://localhost';
    var options = { };
    var chFactory = channelFactory.create(host, options);
    assert(stubs.connFactory.create.calledWith(host, options));
  });

  test('get creates a new channel', function(done) {
    var stubs = build();

    var chId = 1;
    stubs.conn.createChannel.onCall(0).returns(p({ id: chId++ }));
    stubs.conn.createChannel.onCall(1).returns(p({ id: chId++ }));

    var chFactory = channelFactory.create('');
    chFactory.get().then(function(ch1) {
      assert(_.isObject(ch1));
      chFactory.get().then(function(ch2) {
        assert(_.isObject(ch1));
        assert.notEqual(ch1, ch2);
        done();
      })
    });
  });

  test('close closes connection', function(done) {
    var stubs = build();
    var host = 'amqp://localhost';
    var chFactory = channelFactory.create(host);
    chFactory.close().then(function() {
      assert(stubs.conn.close.calledOnce);
      done();
    });
  });

})
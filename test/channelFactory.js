var assert = require('chai').assert
  , sinon = require('sinon')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , connectionPool = require('../lib/connectionPool')
  , channelFactory = require('../lib/channelFactory');

var fn = function() { };
var p = function(v) {
  return new Promise(function(f) { f(v); });
}

var sandbox;

function build() {

  var conn = { close: fn, createChannel: fn }
  var connPool = { getNext: fn, getAll: fn }

  // Default stubbing behavior
  var createStub = sandbox.stub(connectionPool, 'create').returns(connPool);
  var getNextStub = sandbox.stub(connPool, 'getNext').returns(p(conn));
  var getAllStub = sandbox.stub(connPool, 'getAll').returns([p(conn)]);
  var closeStub = sandbox.spy(conn, 'close');
  var createChannelStub = sandbox.stub(conn, 'createChannel');

  return {
    connPool: {
      create: createStub,
      getNext: getNextStub,
      getAll: getAllStub
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
    var options = { connectionPoolCount: _.random(1, 100) };
    var chFactory = channelFactory.create(host, options);
    assert(stubs.connPool.create.calledWith(host, options));
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

  test('closeAll closes connection', function(done) {
    var stubs = build();
    var host = 'amqp://localhost';
    var chFactory = channelFactory.create(host);
    chFactory.closeAll().then(function() {
      assert(stubs.conn.close.calledOnce);
      done();
    });
  });

})
var assert = require('chai').assert
  , sinon = require('sinon')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , amqp = require('amqplib')
  , channelFactory = require('../lib/channelFactory')

var fn = function() { };
var p = function(v) {
  return new Promise(function(f) { f(v); });
}

var sandbox;

function build() {

  var conn = { close: fn, createChannel: fn }

  // Default stubbing behavior
  var closeStub = sandbox.spy(conn, 'close');
  var connectStub = sandbox.stub(amqp, 'connect').returns(p(conn));
  var createChannelStub = sandbox.stub(conn, 'createChannel');

  return {
    amqp: {
      connect: connectStub
    },
    conn: {
      close: closeStub,
      createChannel: createChannelStub
    }
  }
}

suite('ChannelFactory', function() {

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  test('channelFactory initiates connection', function() {
    var stubs = build();
    var host = 'amqp://localhost';
    var options = { setting: true };
    var chFactory = channelFactory.create(host, options);
    assert(stubs.amqp.connect.calledWith(host));
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
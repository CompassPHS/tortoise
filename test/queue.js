var assert = require('assert')
  , sinon = require('sinon')
  , async = require('async')
  , Promise = require('bluebird');

var Queue = require('../lib/queue');

var emptyFn = function() { };
var quickPromise = function(returnValue) {
  return new Promise(function(f) { f(returnValue); });
}

function build() {

  var ch = { consume: emptyFn,assertQueue: emptyFn, assertExchange: emptyFn, publish: emptyFn, close: emptyFn, sendToQueue: emptyFn };
  var conn = { createChannel: emptyFn };

  // Default stubbing behavior
  var createChannelStub = sinon.stub(conn, 'createChannel').returns(quickPromise(ch));
  var assertExchangeStub = sinon.stub(ch, 'assertExchange').returns(quickPromise());
  var assertQueueStub = sinon.stub(ch, 'assertQueue').returns(quickPromise());
  var sendToQueueStub = sinon.stub(ch, 'sendToQueue');
  var closeStub = sinon.stub(ch, 'close').returns(quickPromise());

  return {
    conn: {
      createChannel: createChannelStub
    },
    ch: {
      assertExchange: assertExchangeStub,
      sendToQueue: sendToQueueStub,
      close: closeStub,
      assertQueue: assertQueueStub
    }
  }
}

suite('Queue', function() {

  test('publish publishes message to provided queue', function(done) {
    var stubs = build();

    var ex = new Queue(quickPromise(stubs.conn))
      .configure('myQueue', {})
      .publish({Hello:'World'})
      .then(function() {
        assert(stubs.ch.sendToQueue.calledWith('myQueue'))
        
        var msg = JSON.parse(stubs.ch.sendToQueue.args[0][1].toString());
        assert.equal(msg.Hello, 'World');

        done();
      });

  });

  test('publish closes channel', function(done) {
    var stubs = build();

    var ex = new Queue(quickPromise(stubs.conn))
      .publish({})
      .then(function() {
        assert(stubs.ch.close.calledOnce)
        done();
      });
  });

  test('configure sets options', function(done) {
    var stubs = build();

    var opts = {};

    new Queue(quickPromise(stubs.conn))
      .configure('myQueue', opts)
      .publish({})
      .then(function() {
        assert(stubs.ch.assertQueue.calledWithExactly('myQueue', opts));
        done()
      });
  });

  test('default options are set', function(done) {
    var stubs = build();

    new Queue(quickPromise(stubs.conn))
      .publish({})
      .then(function() {
        assert(stubs.ch.assertQueue.calledWithExactly('', {}));
        done()
      });
  });

});